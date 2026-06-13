const BASE_URL = "/api";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

// ---- Documents ----

export const uploadDocument = async (file, name) => {
  const formData = new FormData();
  formData.append("pdf", file);
  if (name) formData.append("name", name);

  const response = await fetch(`${BASE_URL}/documents`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
};

export const listDocuments = async (page = 1, limit = 10) => {
  const response = await fetch(`${BASE_URL}/documents?page=${page}&limit=${limit}`);
  return handleResponse(response);
};

export const getDocument = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}`);
  return handleResponse(response);
};

export const renameDocument = async (id, name) => {
  const response = await fetch(`${BASE_URL}/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
};

export const deleteDocument = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}`, { method: "DELETE" });
  return handleResponse(response);
};

// ---- Dashboard ----

export const getDashboard = async () => {
  const response = await fetch(`${BASE_URL}/dashboard`);
  return handleResponse(response);
};

// ---- Chat ----

export const askQuestion = async (id, question) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return handleResponse(response);
};

// ---- Summary ----

export const getSummary = async (id, regenerate = false) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/summary${regenerate ? "?regenerate=true" : ""}`);
  return handleResponse(response);
};

// ---- Flashcards ----

export const getFlashcards = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/flashcards`);
  return handleResponse(response);
};

export const generateFlashcards = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/flashcards`, { method: "POST" });
  return handleResponse(response);
};

export const exportFlashcardsUrl = (id) => `${BASE_URL}/documents/${id}/flashcards/export`;

// ---- Quiz ----

export const getQuiz = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/quiz`);
  return handleResponse(response);
};

export const generateQuiz = async (id) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/quiz/generate`, { method: "POST" });
  return handleResponse(response);
};

export const submitQuizAttempt = async (id, answers) => {
  const response = await fetch(`${BASE_URL}/documents/${id}/quiz/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  return handleResponse(response);
};

export const exportQuizUrl = (id) => `${BASE_URL}/documents/${id}/quiz/export`;
