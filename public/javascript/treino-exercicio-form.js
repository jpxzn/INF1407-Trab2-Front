import { backendAddress } from "./constantes.js";
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return element;
}
const form = getElement("treino-exercicio-form");
const exercicioSelect = getElement("exercicio");
const seriesInput = getElement("qtd-series");
const repeticoesInput = getElement("qtd-repeticoes");
const pageTitle = getElement("page-title");
const pageSubtitle = getElement("page-subtitle");
const formError = getElement("form-error");
const saveButton = getElement("save-button");
const backLink = getElement("back-link");
const cancelLink = getElement("cancel-link");
const searchParams = new URLSearchParams(window.location.search);
const treinoParameter = searchParams.get("treino");
const relacaoParameter = searchParams.get("id");
const alunoParameter = searchParams.get("aluno");
const treinoId = Number(treinoParameter);
const relacaoId = relacaoParameter
    ? Number(relacaoParameter)
    : null;
const isEditing = relacaoId !== null;
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
function redirectToLogin() {
    window.location.href = "./login.html";
}
function getAlunoSuffix() {
    return alunoParameter
        ? `&aluno=${alunoParameter}`
        : "";
}
function configureNavigation() {
    const destination = `./treino.html?id=${treinoId}${getAlunoSuffix()}`;
    backLink.href = destination;
    cancelLink.href = destination;
}
function getErrorMessage(errors) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return ((_j = (_g = (_e = (_c = (_a = errors.detail) !== null && _a !== void 0 ? _a : (_b = errors.exercicio) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : (_d = errors.qtd_series) === null || _d === void 0 ? void 0 : _d[0]) !== null && _e !== void 0 ? _e : (_f = errors.qtd_repeticoes) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : (_h = errors.non_field_errors) === null || _h === void 0 ? void 0 : _h[0]) !== null && _j !== void 0 ? _j : "Não foi possível salvar o exercício do treino.");
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
function showExercicios(exercicios) {
    for (const exercicio of exercicios) {
        const option = document.createElement("option");
        option.value = String(exercicio.id);
        option.textContent =
            `${exercicio.nome} — ${exercicio.musculo_trabalhado}`;
        exercicioSelect.appendChild(option);
    }
    if (exercicios.length === 0) {
        formError.textContent =
            "Nenhum exercício foi cadastrado.";
        form.classList.add("hidden");
    }
}
async function loadRelacao(accessToken, id) {
    const relacao = await fetchAuthenticated(`api/treinos/${treinoId}/exercicios/${id}/`, accessToken);
    if (!relacao) {
        return;
    }
    exercicioSelect.value =
        String(relacao.exercicio);
    seriesInput.value =
        String(relacao.qtd_series);
    repeticoesInput.value =
        String(relacao.qtd_repeticoes);
    pageTitle.textContent =
        "Editar exercício do treino";
    pageSubtitle.textContent =
        "Altere o exercício, as séries ou as repetições.";
    document.title =
        "Editar exercício do treino | GymControl";
}
async function saveRelacao(accessToken) {
    formError.textContent = "";
    const exercicioId = Number(exercicioSelect.value);
    const qtdSeries = Number(seriesInput.value);
    const qtdRepeticoes = Number(repeticoesInput.value);
    if (!Number.isInteger(exercicioId) ||
        exercicioId <= 0) {
        formError.textContent =
            "Selecione um exercício.";
        exercicioSelect.focus();
        return;
    }
    if (!Number.isInteger(qtdSeries) ||
        qtdSeries <= 0) {
        formError.textContent =
            "Informe uma quantidade válida de séries.";
        seriesInput.focus();
        return;
    }
    if (!Number.isInteger(qtdRepeticoes) ||
        qtdRepeticoes <= 0) {
        formError.textContent =
            "Informe uma quantidade válida de repetições.";
        repeticoesInput.focus();
        return;
    }
    const path = isEditing
        ? (`api/treinos/${treinoId}/` +
            `exercicios/${relacaoId}/`)
        : `api/treinos/${treinoId}/exercicios/`;
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
                exercicio: exercicioId,
                qtd_series: qtdSeries,
                qtd_repeticoes: qtdRepeticoes
            })
        });
        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }
        if (response.status === 403) {
            formError.textContent =
                "Você não possui permissão para alterar este treino.";
            return;
        }
        if (!response.ok) {
            const errors = await response.json();
            formError.textContent =
                getErrorMessage(errors);
            return;
        }
        window.location.href =
            `./treino.html?id=${treinoId}${getAlunoSuffix()}`;
    }
    catch (error) {
        console.error("Erro ao salvar exercício do treino:", error);
        formError.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        saveButton.disabled = false;
        saveButton.textContent = "Salvar";
    }
}
async function initializePage() {
    if (!treinoParameter ||
        !Number.isInteger(treinoId) ||
        treinoId <= 0) {
        formError.textContent =
            "Identificador de treino inválido.";
        form.classList.add("hidden");
        return;
    }
    if (relacaoParameter &&
        (relacaoId === null ||
            !Number.isInteger(relacaoId) ||
            relacaoId <= 0)) {
        formError.textContent =
            "Identificador da relação inválido.";
        form.classList.add("hidden");
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
        const exercicios = await fetchAuthenticated("api/exercicios/", accessToken);
        if (!exercicios) {
            return;
        }
        showExercicios(exercicios);
        if (isEditing && relacaoId !== null) {
            await loadRelacao(accessToken, relacaoId);
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            void saveRelacao(accessToken);
        });
    }
    catch (error) {
        console.error("Erro ao preparar formulário:", error);
        formError.textContent =
            "Não foi possível carregar o formulário.";
    }
}
void initializePage();
