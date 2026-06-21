import { backendAddress } from "./constantes.js";
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return element;
}
const treinoForm = getElement("treino-form");
const nomeInput = getElement("nome");
const pageTitle = getElement("page-title");
const pageSubtitle = getElement("page-subtitle");
const formError = getElement("form-error");
const saveButton = getElement("save-button");
const backLink = getElement("back-link");
const cancelLink = getElement("cancel-link");
const searchParams = new URLSearchParams(window.location.search);
const alunoParameter = searchParams.get("aluno");
const treinoParameter = searchParams.get("id");
const alunoId = Number(alunoParameter);
const treinoId = treinoParameter
    ? Number(treinoParameter)
    : null;
const isEditing = treinoId !== null;
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
function redirectToLogin() {
    window.location.href = "./login.html";
}
function configureNavigation() {
    const destination = `./treinos.html?aluno=${alunoId}`;
    backLink.href = destination;
    cancelLink.href = destination;
}
function getErrorMessage(errors) {
    var _a, _b, _c, _d, _e, _f, _g;
    return ((_g = (_e = (_c = (_a = errors.detail) !== null && _a !== void 0 ? _a : (_b = errors.nome) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : (_d = errors.aluno) === null || _d === void 0 ? void 0 : _d[0]) !== null && _e !== void 0 ? _e : (_f = errors.non_field_errors) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : "Não foi possível salvar o treino.");
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
    if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
    }
    return await response.json();
}
async function loadTreino(accessToken, id) {
    const treino = await fetchAuthenticated(`api/treinos/${id}/`, accessToken);
    if (!treino) {
        return;
    }
    if (treino.aluno !== alunoId) {
        throw new Error("O treino não pertence ao aluno informado.");
    }
    nomeInput.value = treino.nome;
    pageTitle.textContent = "Editar treino";
    pageSubtitle.textContent =
        "Altere o nome do treino selecionado.";
    document.title = "Editar treino | GymControl";
}
async function saveTreino(accessToken) {
    formError.textContent = "";
    const nome = nomeInput.value.trim();
    if (!nome) {
        formError.textContent =
            "Informe o nome do treino.";
        nomeInput.focus();
        return;
    }
    const path = isEditing
        ? `api/treinos/${treinoId}/`
        : "api/treinos/";
    const method = isEditing
        ? "PUT"
        : "POST";
    saveButton.disabled = true;
    saveButton.textContent = "Salvando...";
    try {
        const response = await fetch(`${backendAddress}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                aluno: alunoId,
                nome
            })
        });
        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }
        if (response.status === 403) {
            formError.textContent =
                "Você não possui permissão para salvar treinos.";
            return;
        }
        if (!response.ok) {
            const errors = await response.json();
            formError.textContent =
                getErrorMessage(errors);
            return;
        }
        window.location.href =
            `./treinos.html?aluno=${alunoId}`;
    }
    catch (error) {
        console.error("Erro ao salvar treino:", error);
        formError.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        saveButton.disabled = false;
        saveButton.textContent = "Salvar";
    }
}
async function initializePage() {
    if (!alunoParameter ||
        !Number.isInteger(alunoId) ||
        alunoId <= 0) {
        formError.textContent =
            "Identificador de aluno inválido.";
        treinoForm.classList.add("hidden");
        return;
    }
    if (treinoParameter &&
        (treinoId === null ||
            !Number.isInteger(treinoId) ||
            treinoId <= 0)) {
        formError.textContent =
            "Identificador de treino inválido.";
        treinoForm.classList.add("hidden");
        return;
    }
    configureNavigation();
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        redirectToLogin();
        return;
    }
    try {
        const authenticatedUser = await fetchAuthenticated("api/accounts/whoami/", accessToken);
        if (!authenticatedUser) {
            return;
        }
        if (!authenticatedUser.is_staff) {
            window.location.href = "./treinos.html";
            return;
        }
        if (isEditing && treinoId !== null) {
            await loadTreino(accessToken, treinoId);
        }
        treinoForm.addEventListener("submit", (event) => {
            event.preventDefault();
            void saveTreino(accessToken);
        });
    }
    catch (error) {
        console.error("Erro ao preparar formulário:", error);
        formError.textContent =
            "Não foi possível carregar o formulário.";
    }
}
void initializePage();
