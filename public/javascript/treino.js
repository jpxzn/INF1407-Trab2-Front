import { backendAddress } from "./constantes.js";
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return element;
}
const adminTopActions = getElement("admin-top-actions");
const treinoName = getElement("treino-name");
const loadingMessage = getElement("loading-message");
const pageError = getElement("page-error");
const exerciciosList = getElement("exercicios-list");
const backLink = getElement("back-link");
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
function redirectToLogin() {
    window.location.href = "./login.html";
}
async function fetchAuthenticated(path, accessToken) {
    const response = await fetch(`${backendAddress}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    if (response.status === 401) {
        removeTokens();
        redirectToLogin();
        return null;
    }
    if (response.status === 404) {
        throw new Error("NOT_FOUND");
    }
    if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
    }
    return await response.json();
}
function createMetaBox(labelText, valueText) {
    const box = document.createElement("div");
    box.classList.add("meta-box");
    const label = document.createElement("span");
    label.classList.add("meta-label");
    label.textContent = labelText;
    const value = document.createElement("span");
    value.classList.add("meta-value");
    value.textContent = valueText;
    box.append(label, value);
    return box;
}
function createExerciseCard(treinoExercicio, isAdmin) {
    const article = document.createElement("article");
    article.classList.add("treino-card");
    const title = document.createElement("h2");
    title.classList.add("card-title");
    title.textContent = treinoExercicio.exercicio_nome;
    const meta = document.createElement("div");
    meta.classList.add("exercise-meta");
    meta.append(createMetaBox("Músculo", treinoExercicio.musculo_trabalhado), createMetaBox("Séries", String(treinoExercicio.qtd_series)), createMetaBox("Repetições", String(treinoExercicio.qtd_repeticoes)));
    article.append(title, meta);
    if (isAdmin) {
        const actions = document.createElement("div");
        actions.classList.add("treino-actions");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.classList.add("edit-link");
        editButton.textContent = "Editar";
        editButton.dataset.relacaoId =
            String(treinoExercicio.id);
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("delete-button");
        removeButton.textContent = "Remover";
        removeButton.dataset.relacaoId =
            String(treinoExercicio.id);
        actions.append(editButton, removeButton);
        article.appendChild(actions);
    }
    return article;
}
function showExercises(exercises, isAdmin) {
    exerciciosList.replaceChildren();
    if (exercises.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent =
            "Este treino ainda não possui exercícios.";
        exerciciosList.appendChild(emptyMessage);
        return;
    }
    for (const exercise of exercises) {
        exerciciosList.appendChild(createExerciseCard(exercise, isAdmin));
    }
}
function configureBackLink() {
    const searchParams = new URLSearchParams(window.location.search);
    const alunoId = searchParams.get("aluno");
    if (alunoId) {
        backLink.href =
            `./treinos.html?aluno=${alunoId}`;
        backLink.textContent =
            "← Voltar para os treinos do aluno";
    }
}
async function initializePage() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        redirectToLogin();
        return;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const treinoParameter = searchParams.get("id");
    const treinoId = Number(treinoParameter);
    if (!treinoParameter ||
        !Number.isInteger(treinoId) ||
        treinoId <= 0) {
        loadingMessage.classList.add("hidden");
        pageError.textContent =
            "Identificador de treino inválido.";
        return;
    }
    configureBackLink();
    try {
        const authenticatedUser = await fetchAuthenticated("api/accounts/whoami/", accessToken);
        if (!authenticatedUser) {
            return;
        }
        if (authenticatedUser.is_staff) {
            showAddExerciseButton(treinoId);
        }
        const treino = await fetchAuthenticated(`api/treinos/${treinoId}/`, accessToken);
        if (!treino) {
            return;
        }
        treinoName.textContent = treino.nome;
        document.title = `${treino.nome} | GymControl`;
        const exercises = await fetchAuthenticated(`api/treinos/${treinoId}/exercicios/`, accessToken);
        if (!exercises) {
            return;
        }
        showExercises(exercises, authenticatedUser.is_staff);
    }
    catch (error) {
        console.error("Erro ao carregar treino:", error);
        if (error instanceof Error &&
            error.message === "NOT_FOUND") {
            pageError.textContent =
                "Treino não encontrado ou sem permissão de acesso.";
        }
        else {
            pageError.textContent =
                "Não foi possível carregar o treino.";
        }
    }
    finally {
        loadingMessage.classList.add("hidden");
    }
}
function showAddExerciseButton(treinoId) {
    adminTopActions.replaceChildren();
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.classList.add("main-link-button");
    addButton.textContent = "Adicionar exercício";
    addButton.dataset.treinoId = String(treinoId);
    adminTopActions.appendChild(addButton);
    adminTopActions.classList.remove("hidden");
}
void initializePage();
