import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../../config/apiConfig";
import QuestionBankView from "./QuestionBankView";
export interface Exam {
    _id: string;
    title: string;
    subject?: string;
    degree?: string;
    yearOfStudy?: number;
    semester?: number;
    duration: number;
    questionCount: number;
    totalMarks: number;
    passingMarks: number;
    negativeMarking?: boolean;
    negativePenalty?: number;
    published?: boolean;
}
export type QuestionType = "single" | "multi";
export interface Question {
    _id: string;
    examId: string;
    questionText: string;
    type: QuestionType;
    options: string[];
    correctAnswers: string[];
    marks: number;
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
    order?: number;
}
export interface FormState {
    questionText: string;
    type: QuestionType;
    options: string[];
    correctAnswers: string[];
    marks: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
}
const emptyForm: FormState = {
    questionText: "",
    type: "single",
    options: ["", "", "", ""],
    correctAnswers: [],
    marks: 1,
    explanation: "",
    difficulty: "medium",
};
// QuestionBank component
function QuestionBank() {
    const navigate = useNavigate();
    const { examId } = useParams<{
        examId: string;
    }>();
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [search, setSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    useEffect(() => {
        if (!examId) {
            navigate("/instructor");
            return;
        }
        loadData();
    }, [examId]);
    useEffect(() => {
        if (!success)
            return;
        const timer = setTimeout(() => {
            setSuccess("");
        }, 3000);
        return () => clearTimeout(timer);
    }, [success]);
    async function loadData() {
        if (!examId)
            return;
        setLoading(true);
        setError("");
        try {
            const [examResponse, questionsResponse] = await Promise.all([
                fetch(`${API_URL}/exams/${examId}`, {
                    credentials: "include",
                }),
                fetch(`${API_URL}/questions/exam/${examId}`, {
                    credentials: "include",
                }),
            ]);
            if (examResponse.status === 401 || questionsResponse.status === 401) {
                navigate("/");
                return;
            }
            if (!examResponse.ok) {
                const data = await examResponse.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load exam");
            }
            if (!questionsResponse.ok) {
                const data = await questionsResponse.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load questions");
            }
            const examData = await examResponse.json();
            const questionsData = await questionsResponse.json();
            const loadedQuestions: Question[] = Array.isArray(questionsData.questions) ? questionsData.questions : [];
            const loadedExam = examData.exam || examData;
            setExam({ ...loadedExam, questionCount: loadedQuestions.length });
            setQuestions(loadedQuestions);
        }
        catch (err) {
            setError(err instanceof Error
                ? err.message
                : "Something went wrong while loading the question bank.");
        }
        finally {
            setLoading(false);
        }
    }
    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowForm(true);
    }
    function openEditForm(question: Question) {
        setEditingId(question._id);
        setForm({
            questionText: question.questionText,
            type: question.type,
            options: [...question.options],
            correctAnswers: [...question.correctAnswers],
            marks: question.marks,
            explanation: question.explanation || "",
            difficulty: question.difficulty || "medium",
        });
        setError("");
        setSuccess("");
        setShowForm(true);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }
    function closeForm() {
        if (saving)
            return;
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    }
    function updateOption(index: number, value: string) {
        setForm((current) => {
            const options = [...current.options];
            options[index] = value;
            const oldValue = current.options[index];
            const correctAnswers = current.correctAnswers.map((answer) => answer === oldValue ? value : answer);
            return {
                ...current,
                options,
                correctAnswers,
            };
        });
    }
    function addOption() {
        if (form.options.length >= 6)
            return;
        setForm((current) => ({
            ...current,
            options: [...current.options, ""],
        }));
    }
    function removeOption(index: number) {
        if (form.options.length <= 2)
            return;
        setForm((current) => {
            const removedOption = current.options[index];
            const options = current.options.filter((_, optionIndex) => optionIndex !== index);
            const correctAnswers = current.correctAnswers.filter((answer) => answer !== removedOption);
            return {
                ...current,
                options,
                correctAnswers,
            };
        });
    }
    function toggleCorrectAnswer(option: string) {
        if (!option.trim())
            return;
        setForm((current) => {
            if (current.type === "single") {
                return {
                    ...current,
                    correctAnswers: [option],
                };
            }
            const exists = current.correctAnswers.includes(option);
            return {
                ...current,
                correctAnswers: exists
                    ? current.correctAnswers.filter((answer) => answer !== option)
                    : [...current.correctAnswers, option],
            };
        });
    }
    function changeQuestionType(type: QuestionType) {
        setForm((current) => ({
            ...current,
            type,
            correctAnswers: type === "single"
                ? current.correctAnswers.slice(0, 1)
                : current.correctAnswers,
        }));
    }
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!examId)
            return;
        setError("");
        setSuccess("");
        const questionText = form.questionText.trim();
        const options = form.options
            .map((option) => option.trim())
            .filter(Boolean);
        const correctAnswers = form.correctAnswers
            .map((answer) => answer.trim())
            .filter(Boolean);
        if (!questionText) {
            setError("Please enter the question.");
            return;
        }
        if (options.length < 2) {
            setError("Please provide at least two options.");
            return;
        }
        if (new Set(options).size !== options.length) {
            setError("Options must be unique.");
            return;
        }
        if (correctAnswers.length === 0) {
            setError("Please select at least one correct answer.");
            return;
        }
        if (form.type === "single" && correctAnswers.length !== 1) {
            setError("A single-correct question must have exactly one correct answer.");
            return;
        }
        if (correctAnswers.some((answer) => !options.some((option) => option === answer))) {
            setError("Every correct answer must match one of the options.");
            return;
        }
        if (!Number.isFinite(form.marks) || form.marks <= 0) {
            setError("Marks must be greater than zero.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                examId,
                questionText,
                type: form.type,
                options,
                correctAnswers,
                marks: Number(form.marks),
                explanation: form.explanation.trim(),
                difficulty: form.difficulty,
                order: editingId
                    ? questions.find((question) => question._id === editingId)?.order
                    : questions.length + 1,
            };
            const response = await fetch(editingId
                ? `${API_URL}/questions/${editingId}`
                : `${API_URL}/questions`, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            if (response.status === 401) {
                navigate("/");
                return;
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message ||
                    (editingId
                        ? "Failed to update question."
                        : "Failed to create question."));
            }
            const savedQuestion = data.question;
            if (editingId) {
                setQuestions((current) => current.map((question) => question._id === editingId
                    ? savedQuestion || { ...question, ...payload }
                    : question));
                setSuccess("Question updated successfully.");
            }
            else {
                if (savedQuestion) {
                    setQuestions((current) => {
                        const updated = [...current, savedQuestion].map((question, index) => ({ ...question, order: index + 1 }));
                        setExam((exam) => exam ? { ...exam, questionCount: updated.length } : exam);
                        return updated;
                    });
                }
                else {
                    await loadData();
                }
                setSuccess("Question added successfully.");
            }
            closeForm();
        }
        catch (err) {
            setError(err instanceof Error
                ? err.message
                : "Something went wrong while saving the question.");
        }
        finally {
            setSaving(false);
        }
    }
    function handleDelete(question: Question) {
        if (deletingId)
            return;
        setError("");
        setSuccess("");
        setDeleteTarget(question);
    }
    async function confirmDelete() {
        if (!deleteTarget)
            return;
        const questionId = deleteTarget._id;
        setDeletingId(questionId);
        setError("");
        setSuccess("");
        try {
            const response = await fetch(`${API_URL}/questions/${questionId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.status === 401) {
                navigate("/");
                return;
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete question.");
            }
            setQuestions((current) => {
                const updated = current
                    .filter((question) => question._id !== questionId)
                    .map((question, index) => ({ ...question, order: index + 1 }));
                setExam((exam) => exam ? { ...exam, questionCount: updated.length } : exam);
                return updated;
            });
            setDeleteTarget(null);
            setSuccess("Question deleted successfully.");
        }
        catch (err) {
            setError(err instanceof Error
                ? err.message
                : "Something went wrong while deleting the question.");
        }
        finally {
            setDeletingId(null);
        }
    }
    const filteredQuestions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return [...questions]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .filter((question) => {
            const matchesSearch = !query ||
                question.questionText.toLowerCase().includes(query) ||
                question.options.some((option) => option.toLowerCase().includes(query));
            const matchesDifficulty = difficultyFilter === "all" ||
                question.difficulty === difficultyFilter;
            const matchesType = typeFilter === "all" || question.type === typeFilter;
            return matchesSearch && matchesDifficulty && matchesType;
        });
    }, [questions, search, difficultyFilter, typeFilter]);
    const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + question.marks, 0), [questions]);
    const progress = exam && exam.questionCount > 0
        ? Math.min((questions.length / exam.questionCount) * 100, 100)
        : 0;
    return (<QuestionBankView exam={exam} questions={questions} loading={loading} saving={saving} deletingId={deletingId} deleteTarget={deleteTarget} error={error} success={success} showForm={showForm} editingId={editingId} form={form} search={search} difficultyFilter={difficultyFilter} typeFilter={typeFilter} setDeleteTarget={setDeleteTarget} setDifficultyFilter={setDifficultyFilter} setError={setError} setForm={setForm} setSearch={setSearch} setTypeFilter={setTypeFilter} navigate={navigate} openCreateForm={openCreateForm} openEditForm={openEditForm} closeForm={closeForm} updateOption={updateOption} addOption={addOption} removeOption={removeOption} toggleCorrectAnswer={toggleCorrectAnswer} changeQuestionType={changeQuestionType} handleSubmit={handleSubmit} handleDelete={handleDelete} confirmDelete={confirmDelete} filteredQuestions={filteredQuestions} totalMarks={totalMarks} progress={progress} loadData={loadData}/>);
}
export default QuestionBank;
