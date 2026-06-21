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
async function deleteTreinoExercicio(relacao, treinoId, removeButton) {
    const confirmed = window.confirm((`Tem certeza de que deseja remover ` +
        `"${relacao.exercicio_nome}" deste treino?`));
    if (!confirmed) {
        return;
    }
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        redirectToLogin();
        return;
    }
    pageError.textContent = "";
    removeButton.disabled = true;
    removeButton.textContent = "Removendo...";
    try {
        const response = await fetch((`${backendAddress}api/treinos/${treinoId}/` +
            `exercicios/${relacao.id}/`), {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }
        if (response.status === 403) {
            pageError.textContent =
                "Você não possui permissão para remover exercícios.";
            return;
        }
        if (response.status === 404) {
            pageError.textContent =
                "Exercício do treino não encontrado.";
            return;
        }
        if (!response.ok) {
            pageError.textContent =
                "Não foi possível remover o exercício.";
            return;
        }
        window.location.reload();
    }
    catch (error) {
        console.error("Erro ao remover exercício do treino:", error);
        pageError.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        removeButton.disabled = false;
        removeButton.textContent = "Remover";
    }
}
function createExerciseCard(treinoExercicio, isAdmin, treinoId, alunoParameter) {
    const article = document.createElement("article");
    article.classList.add("treino-card");
    const title = document.createElement("h2");
    title.classList.add("card-title");
    title.textContent =
        treinoExercicio.exercicio_nome;
    const meta = document.createElement("div");
    meta.classList.add("exercise-meta");
    meta.append(createMetaBox("Músculo", treinoExercicio.musculo_trabalhado), createMetaBox("Séries", String(treinoExercicio.qtd_series)), createMetaBox("Repetições", String(treinoExercicio.qtd_repeticoes)));
    article.append(title, meta);
    if (isAdmin) {
        const actions = document.createElement("div");
        actions.classList.add("treino-actions");
        const alunoSuffix = alunoParameter
            ? `&aluno=${alunoParameter}`
            : "";
        const editLink = document.createElement("a");
        editLink.classList.add("edit-link");
        editLink.textContent = "Editar";
        editLink.href =
            (`./treino-exercicio-form.html?` +
                `treino=${treinoId}` +
                `&id=${treinoExercicio.id}` +
                alunoSuffix);
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("delete-button");
        removeButton.textContent = "Remover";
        removeButton.addEventListener("click", () => {
            void deleteTreinoExercicio(treinoExercicio, treinoId, removeButton);
        });
        actions.append(editLink, removeButton);
        article.appendChild(actions);
    }
    return article;
}
function showExercises(exercises, isAdmin, treinoId, alunoParameter) {
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
        exerciciosList.appendChild(createExerciseCard(exercise, isAdmin, treinoId, alunoParameter));
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
    const alunoParameter = searchParams.get("aluno");
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
            showAddExerciseButton(treinoId, alunoParameter);
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
        showExercises(exercises, authenticatedUser.is_staff, treinoId, alunoParameter);
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
function showAddExerciseButton(treinoId, alunoParameter) {
    adminTopActions.replaceChildren();
    const addLink = document.createElement("a");
    addLink.classList.add("main-link-button");
    addLink.textContent = "Adicionar exercício";
    const alunoSuffix = alunoParameter
        ? `&aluno=${alunoParameter}`
        : "";
    addLink.href =
        (`./treino-exercicio-form.html?` +
            `treino=${treinoId}${alunoSuffix}`);
    adminTopActions.appendChild(addLink);
    adminTopActions.classList.remove("hidden");
}
void initializePage();
