import { backendAddress } from "./constantes.js";

interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

interface Treino {
    id: number;
    aluno: number;
    nome: string;
}

interface ApiErrors {
    detail?: string;
    nome?: string[];
    aluno?: string[];
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

const treinoForm = getElement<HTMLFormElement>(
    "treino-form"
);

const nomeInput = getElement<HTMLInputElement>(
    "nome"
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

const alunoParameter = searchParams.get("aluno");
const treinoParameter = searchParams.get("id");

const alunoId = Number(alunoParameter);

const treinoId = treinoParameter
    ? Number(treinoParameter)
    : null;

const isEditing = treinoId !== null;

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function redirectToLogin(): void {
    window.location.href = "./login.html";
}

function configureNavigation(): void {
    const destination =
        `./treinos.html?aluno=${alunoId}`;

    backLink.href = destination;
    cancelLink.href = destination;
}

function getErrorMessage(errors: ApiErrors): string {
    return (
        errors.detail ??
        errors.nome?.[0] ??
        errors.aluno?.[0] ??
        errors.non_field_errors?.[0] ??
        "Não foi possível salvar o treino."
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

async function loadTreino(
    accessToken: string,
    id: number
): Promise<void> {
    const treino = await fetchAuthenticated<Treino>(
        `api/treinos/${id}/`,
        accessToken
    );

    if (!treino) {
        return;
    }

    if (treino.aluno !== alunoId) {
        throw new Error(
            "O treino não pertence ao aluno informado."
        );
    }

    nomeInput.value = treino.nome;

    pageTitle.textContent = "Editar treino";
    pageSubtitle.textContent =
        "Altere o nome do treino selecionado.";

    document.title = "Editar treino | GymControl";
}

async function saveTreino(
    accessToken: string
): Promise<void> {
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
        const response = await fetch(
            `${backendAddress}${path}`,
            {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    aluno: alunoId,
                    nome
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
                "Você não possui permissão para salvar treinos.";

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
            `./treinos.html?aluno=${alunoId}`;
    } catch (error: unknown) {
        console.error(
            "Erro ao salvar treino:",
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
        !alunoParameter ||
        !Number.isInteger(alunoId) ||
        alunoId <= 0
    ) {
        formError.textContent =
            "Identificador de aluno inválido.";

        treinoForm.classList.add("hidden");
        return;
    }

    if (
        treinoParameter &&
        (
            treinoId === null ||
            !Number.isInteger(treinoId) ||
            treinoId <= 0
        )
    ) {
        formError.textContent =
            "Identificador de treino inválido.";

        treinoForm.classList.add("hidden");
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

        if (isEditing && treinoId !== null) {
            await loadTreino(
                accessToken,
                treinoId
            );
        }

        treinoForm.addEventListener(
            "submit",
            (event): void => {
                event.preventDefault();

                void saveTreino(accessToken);
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