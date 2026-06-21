import { backendAddress } from "./constantes.js";

interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

interface Aluno {
    id: number;
    user: number;
    username: string;
    email: string;
    peso: number | null;
    altura: number | null;
}

interface Treino {
    id: number;
    aluno: number;
    nome: string;
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

const pageTitle = getElement<HTMLHeadingElement>(
    "page-title"
);

const pageSubtitle = getElement<HTMLParagraphElement>(
    "page-subtitle"
);

const loadingMessage = getElement<HTMLParagraphElement>(
    "loading-message"
);

const pageError = getElement<HTMLParagraphElement>(
    "page-error"
);

const contentList = getElement<HTMLElement>(
    "content-list"
);

const backLink = getElement<HTMLAnchorElement>(
    "back-link"
);
const adminTopActions = getElement<HTMLDivElement>(
    "admin-top-actions"
);

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function redirectToLogin(): void {
    window.location.href = "./login.html";
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
            `Erro HTTP ${response.status} ao acessar ${path}`
        );
    }

    return await response.json() as T;
}

function createAlunoCard(aluno: Aluno): HTMLElement {
    const article = document.createElement("article");
    article.classList.add("treino-card");

    const link = document.createElement("a");
    link.classList.add("card-link");
    link.href = `./treinos.html?aluno=${aluno.id}`;

    const title = document.createElement("h2");
    title.classList.add("card-title");
    title.textContent = aluno.username;

    const email = document.createElement("p");
    email.classList.add("card-text");
    email.textContent = aluno.email || "E-mail não informado";

    const description = document.createElement("p");
    description.classList.add("card-text");
    description.textContent =
        "Clique para visualizar os treinos deste aluno.";

    link.append(
        title,
        email,
        description
    );

    article.appendChild(link);

    return article;
}

function createTreinoCard(
    treino: Treino,
    alunoId?: number,
    isAdmin: boolean = false
): HTMLElement {
    const article = document.createElement("article");
    article.classList.add("treino-card");

    const link = document.createElement("a");
    link.classList.add("card-link");

    const alunoParameter = alunoId
        ? `&aluno=${alunoId}`
        : "";

    link.href =
        `./treino.html?id=${treino.id}${alunoParameter}`;

    const title = document.createElement("h2");
    title.classList.add("card-title");
    title.textContent = treino.nome;

    const description = document.createElement("p");
    description.classList.add("card-text");
    description.textContent =
        "Visualize os exercícios, séries e repetições deste treino.";

    link.append(
        title,
        description
    );

    article.appendChild(link);

    if (isAdmin) {
        const actions = document.createElement("div");
        actions.classList.add("treino-actions");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.classList.add("edit-link");
        editButton.textContent = "Editar";
        editButton.dataset.treinoId = String(treino.id);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.classList.add("delete-button");
        deleteButton.textContent = "Excluir";
        deleteButton.dataset.treinoId = String(treino.id);

        actions.append(
            editButton,
            deleteButton
        );

        article.appendChild(actions);
    }

    return article;
}

function showAlunos(alunos: Aluno[]): void {
    contentList.replaceChildren();

    if (alunos.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent =
            "Nenhum aluno cadastrado.";

        contentList.appendChild(emptyMessage);

        return;
    }

    for (const aluno of alunos) {
        contentList.appendChild(
            createAlunoCard(aluno)
        );
    }
}

function showTreinos(
    treinos: Treino[],
    emptyText: string,
    alunoId?: number,
    isAdmin: boolean = false
): void {
    contentList.replaceChildren();

    if (treinos.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = emptyText;

        contentList.appendChild(emptyMessage);

        return;
    }

    for (const treino of treinos) {
        contentList.appendChild(
            createTreinoCard(
                treino,
                alunoId,
                isAdmin
            )
        );
    }
}

async function loadStudentView(
    accessToken: string
): Promise<void> {
    pageTitle.textContent = "Meus treinos";

    pageSubtitle.textContent =
        "Confira os treinos preparados especialmente para você.";

    const treinos = await fetchAuthenticated<Treino[]>(
        "api/treinos/",
        accessToken
    );

    if (!treinos) {
        return;
    }

    showTreinos(
        treinos,
        "Você ainda não possui treinos cadastrados."
    );
}

async function loadAdminStudentsView(
    accessToken: string
): Promise<void> {
    pageTitle.textContent = "Alunos";

    pageSubtitle.textContent =
        "Selecione um aluno para visualizar e gerenciar seus treinos.";

    const alunos = await fetchAuthenticated<Aluno[]>(
        "api/alunos/",
        accessToken
    );

    if (!alunos) {
        return;
    }

    showAlunos(alunos);
}

async function loadAdminStudentTreinos(
    accessToken: string,
    alunoId: number
): Promise<void> {
    const alunos = await fetchAuthenticated<Aluno[]>(
        "api/alunos/",
        accessToken
    );

    if (!alunos) {
        return;
    }

    const aluno = alunos.find(
        (item) => item.id === alunoId
    );

    if (!aluno) {
        pageError.textContent =
            "Aluno não encontrado.";

        return;
    }

    const todosTreinos = await fetchAuthenticated<Treino[]>(
        "api/treinos/",
        accessToken
    );

    if (!todosTreinos) {
        return;
    }

    const treinosDoAluno = todosTreinos.filter(
        (treino) => treino.aluno === alunoId
    );

    backLink.classList.remove("hidden");

    pageTitle.textContent =
        `Treinos de ${aluno.username}`;

    pageSubtitle.textContent =
        "Visualize os treinos cadastrados para este aluno.";
    
    showCreateTreinoButton(alunoId);

    showTreinos(
        treinosDoAluno,
        `${aluno.username} ainda não possui treinos cadastrados.`,
        alunoId,
        true
    );
}

async function initializePage(): Promise<void> {
    const accessToken = localStorage.getItem(
        "access_token"
    );

    if (!accessToken) {
        redirectToLogin();
        return;
    }

    pageError.textContent = "";

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
            await loadStudentView(accessToken);
            return;
        }

        const searchParams = new URLSearchParams(
            window.location.search
        );

        const alunoParameter = searchParams.get("aluno");

        if (!alunoParameter) {
            await loadAdminStudentsView(accessToken);
            return;
        }

        const alunoId = Number(alunoParameter);

        if (
            !Number.isInteger(alunoId) ||
            alunoId <= 0
        ) {
            pageError.textContent =
                "Identificador de aluno inválido.";

            return;
        }

        await loadAdminStudentTreinos(
            accessToken,
            alunoId
        );
    } catch (error: unknown) {
        console.error(
            "Erro ao carregar a página de treinos:",
            error
        );

        pageError.textContent =
            "Não foi possível carregar as informações.";
    } finally {
        loadingMessage.classList.add("hidden");
    }
}

function showCreateTreinoButton(
    alunoId: number
): void {
    adminTopActions.replaceChildren();

    const createButton = document.createElement("button");

    createButton.type = "button";
    createButton.classList.add("main-link-button");
    createButton.textContent = "Criar treino";
    createButton.dataset.alunoId = String(alunoId);

    adminTopActions.appendChild(createButton);
    adminTopActions.classList.remove("hidden");
}

void initializePage();