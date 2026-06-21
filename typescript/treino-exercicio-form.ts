import { backendAddress } from "./constantes.js";

interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

interface Exercicio {
    id: number;
    nome: string;
    link_video: string | null;
    musculo_trabalhado: string;
}

interface TreinoExercicio {
    id: number;
    treino: number;
    exercicio: number;
    exercicio_nome: string;
    musculo_trabalhado: string;
    qtd_series: number;
    qtd_repeticoes: number;
}

interface ApiErrors {
    detail?: string;
    exercicio?: string[];
    qtd_series?: string[];
    qtd_repeticoes?: string[];
    non_field_errors?: string[];
}

function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(
            `Elemento com id "${id}" não encontrado.`
        );
    }

    return element as T;
}

const form = getElement<HTMLFormElement>(
    "treino-exercicio-form"
);

const exercicioSelect = getElement<HTMLSelectElement>(
    "exercicio"
);

const seriesInput = getElement<HTMLInputElement>(
    "qtd-series"
);

const repeticoesInput = getElement<HTMLInputElement>(
    "qtd-repeticoes"
);

const pageTitle = getElement<HTMLHeadingElement>(
    "page-title"
);

const pageSubtitle = getElement<HTMLParagraphElement>(
    "page-subtitle"
);

const formError = getElement<HTMLParagraphElement>(
    "form-error"
);

const saveButton = getElement<HTMLButtonElement>(
    "save-button"
);

const backLink = getElement<HTMLAnchorElement>(
    "back-link"
);

const cancelLink = getElement<HTMLAnchorElement>(
    "cancel-link"
);

const searchParams = new URLSearchParams(
    window.location.search
);

const treinoParameter = searchParams.get("treino");
const relacaoParameter = searchParams.get("id");
const alunoParameter = searchParams.get("aluno");

const treinoId = Number(treinoParameter);

const relacaoId = relacaoParameter
    ? Number(relacaoParameter)
    : null;

const isEditing = relacaoId !== null;

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function redirectToLogin(): void {
    window.location.href = "./login.html";
}

function getAlunoSuffix(): string {
    return alunoParameter
        ? `&aluno=${alunoParameter}`
        : "";
}

function configureNavigation(): void {
    const destination =
        `./treino.html?id=${treinoId}${getAlunoSuffix()}`;

    backLink.href = destination;
    cancelLink.href = destination;
}

function getErrorMessage(errors: ApiErrors): string {
    return (
        errors.detail ??
        errors.exercicio?.[0] ??
        errors.qtd_series?.[0] ??
        errors.qtd_repeticoes?.[0] ??
        errors.non_field_errors?.[0] ??
        "Não foi possível salvar o exercício do treino."
    );
}

async function fetchAuthenticated<T>(
    path: string,
    accessToken: string
): Promise<T | null> {
    const response = await fetch(
        `${backendAddress}${path}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (response.status === 401) {
        removeTokens();
        redirectToLogin();

        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Erro HTTP ${response.status}`
        );
    }

    return await response.json() as T;
}

function showExercicios(exercicios: Exercicio[]): void {
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

async function loadRelacao(
    accessToken: string,
    id: number
): Promise<void> {
    const relacao =
        await fetchAuthenticated<TreinoExercicio>(
            `api/treinos/${treinoId}/exercicios/${id}/`,
            accessToken
        );

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

async function saveRelacao(
    accessToken: string
): Promise<void> {
    formError.textContent = "";

    const exercicioId = Number(
        exercicioSelect.value
    );

    const qtdSeries = Number(
        seriesInput.value
    );

    const qtdRepeticoes = Number(
        repeticoesInput.value
    );

    if (
        !Number.isInteger(exercicioId) ||
        exercicioId <= 0
    ) {
        formError.textContent =
            "Selecione um exercício.";

        exercicioSelect.focus();
        return;
    }

    if (
        !Number.isInteger(qtdSeries) ||
        qtdSeries <= 0
    ) {
        formError.textContent =
            "Informe uma quantidade válida de séries.";

        seriesInput.focus();
        return;
    }

    if (
        !Number.isInteger(qtdRepeticoes) ||
        qtdRepeticoes <= 0
    ) {
        formError.textContent =
            "Informe uma quantidade válida de repetições.";

        repeticoesInput.focus();
        return;
    }

    const path = isEditing
        ? (
            `api/treinos/${treinoId}/` +
            `exercicios/${relacaoId}/`
        )
        : `api/treinos/${treinoId}/exercicios/`;

    const method = isEditing
        ? "PUT"
        : "POST";

    saveButton.disabled = true;
    saveButton.textContent = "Salvando...";

    try {
        const response = await fetch(
            `${backendAddress}${path}`,
            {
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
            }
        );

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
            const errors =
                await response.json() as ApiErrors;

            formError.textContent =
                getErrorMessage(errors);

            return;
        }

        window.location.href =
            `./treino.html?id=${treinoId}${getAlunoSuffix()}`;
    } catch (error: unknown) {
        console.error(
            "Erro ao salvar exercício do treino:",
            error
        );

        formError.textContent =
            "Não foi possível conectar ao servidor.";
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Salvar";
    }
}

async function initializePage(): Promise<void> {
    if (
        !treinoParameter ||
        !Number.isInteger(treinoId) ||
        treinoId <= 0
    ) {
        formError.textContent =
            "Identificador de treino inválido.";

        form.classList.add("hidden");
        return;
    }

    if (
        relacaoParameter &&
        (
            relacaoId === null ||
            !Number.isInteger(relacaoId) ||
            relacaoId <= 0
        )
    ) {
        formError.textContent =
            "Identificador da relação inválido.";

        form.classList.add("hidden");
        return;
    }

    configureNavigation();

    const accessToken = localStorage.getItem(
        "access_token"
    );

    if (!accessToken) {
        redirectToLogin();
        return;
    }

    try {
        const authenticatedUser =
            await fetchAuthenticated<AuthenticatedUser>(
                "api/accounts/whoami/",
                accessToken
            );

        if (!authenticatedUser) {
            return;
        }

        if (!authenticatedUser.is_staff) {
            window.location.href = "./treinos.html";
            return;
        }

        const exercicios =
            await fetchAuthenticated<Exercicio[]>(
                "api/exercicios/",
                accessToken
            );

        if (!exercicios) {
            return;
        }

        showExercicios(exercicios);

        if (isEditing && relacaoId !== null) {
            await loadRelacao(
                accessToken,
                relacaoId
            );
        }

        form.addEventListener(
            "submit",
            (event): void => {
                event.preventDefault();

                void saveRelacao(accessToken);
            }
        );
    } catch (error: unknown) {
        console.error(
            "Erro ao preparar formulário:",
            error
        );

        formError.textContent =
            "Não foi possível carregar o formulário.";
    }
}

void initializePage();