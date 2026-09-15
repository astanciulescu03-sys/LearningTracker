// Toate apelurile catre backend-ul Flask trec prin acest fisier.
// In dezvoltare, Vite face proxy pentru /api catre http://localhost:5000 (vezi vite.config.js).

const BASE_URL = "/api";

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Eroare ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function getCourses(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BASE_URL}/courses${query}`);
  return handleResponse(response);
}

export async function getCourse(id) {
  const response = await fetch(`${BASE_URL}/courses/${id}`);
  return handleResponse(response);
}

export async function createCourse(course) {
  const response = await fetch(`${BASE_URL}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course),
  });
  return handleResponse(response);
}

export async function updateCourse(id, updates) {
  const response = await fetch(`${BASE_URL}/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
}

export async function deleteCourse(id) {
  const response = await fetch(`${BASE_URL}/courses/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function createModule(courseId, module) {
  const response = await fetch(`${BASE_URL}/courses/${courseId}/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(module),
  });
  return handleResponse(response);
}

export async function updateModule(courseId, moduleId, updates) {
  const response = await fetch(
    `${BASE_URL}/courses/${courseId}/modules/${moduleId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  return handleResponse(response);
}

export async function deleteModule(courseId, moduleId) {
  const response = await fetch(
    `${BASE_URL}/courses/${courseId}/modules/${moduleId}`,
    { method: "DELETE" }
  );
  return handleResponse(response);
}

export async function getStats(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BASE_URL}/stats${query}`);
  return handleResponse(response);
}
