import { backendAddress } from "./constantes.js";

interface WhoAmIResponse {
    username: string;
}

const unloggedArea = document.getElementById(
    "unlogged"
) as HTMLDivElement | null;

const loggedArea = document.getElementById(
    "logged"
) as HTMLDivElement | null;

const userName = document.getElementById(
    "user-name"
) as HTMLSpanElement | null;

const userMenuButton = document.getElementById(
    "user-menu-button"
) as HTMLButtonElement | null;

function showUnloggedArea(): void {
    unloggedArea?.classList.remove("hidden");
    loggedArea?.classList.add("hidden");

    closeUserMenu();
}

function showLoggedArea(username: string): void {
    unloggedArea?.classList.add("hidden");
    loggedArea?.classList.remove("hidden");

    if (userName) {
        userName.textContent = `Olá, ${username}`;
    }
}

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function getParentDocument(): Document | null {
    try {
        return window.parent.document;
    } catch (error: unknown) {
        console.error(
            "Não foi possível acessar a página principal:",
            error
        );

        return null;
    }
}

function createMenuStyles(
    parentDocument: Document
): void {
    const existingStyle = parentDocument.getElementById(
        "gymcontrol-user-menu-styles"
    );

    if (existingStyle) {
        return;
    }

    const style = parentDocument.createElement("style");

    style.id = "gymcontrol-user-menu-styles";

    style.textContent = `
        .gymcontrol-user-menu {
            position: fixed;
            z-index: 99999;

            box-sizing: border-box;
            width: 190px;
            padding: 7px;

            background: #ffffff;

            border: 1px solid #e2e8f0;
            border-radius: 10px;

            box-shadow:
                0 12px 30px rgba(15, 23, 42, 0.22);
        }

        .gymcontrol-user-menu-item {
            box-sizing: border-box;

            display: flex;
            align-items: center;

            width: 100%;
            min-height: 40px;
            padding: 9px 11px;

            border: none;
            border-radius: 7px;

            background: transparent;
            color: #1e293b;

            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 500;
            text-align: left;
            text-decoration: none;

            cursor: pointer;
        }

        .gymcontrol-user-menu-item:hover {
            background: #f1f5f9;
        }

        .gymcontrol-user-menu-separator {
            height: 1px;
            margin: 5px 4px;

            background: #e2e8f0;
        }

        .gymcontrol-user-menu-logout {
            color: #dc2626;
        }

        .gymcontrol-user-menu-logout:hover {
            background: #fef2f2;
        }
    `;

    parentDocument.head.appendChild(style);
}

function getUserMenu(): HTMLDivElement | null {
    const parentDocument = getParentDocument();

    return parentDocument?.getElementById(
        "gymcontrol-user-menu"
    ) as HTMLDivElement | null;
}

function closeUserMenu(): void {
    getUserMenu()?.remove();

    userMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );
}

function positionUserMenu(
    menu: HTMLDivElement
): void {
    if (!userMenuButton) {
        return;
    }

    const frameElement =
        window.frameElement as HTMLIFrameElement | null;

    if (!frameElement) {
        return;
    }

    const frameRect =
        frameElement.getBoundingClientRect();

    const buttonRect =
        userMenuButton.getBoundingClientRect();

    const menuTop =
        frameRect.top +
        buttonRect.bottom +
        8;

    const menuRight =
        window.parent.innerWidth -
        (
            frameRect.left +
            buttonRect.right
        );

    menu.style.top = `${menuTop}px`;
    menu.style.right = `${Math.max(menuRight, 12)}px`;
}

function logout(): void {
    removeTokens();
    closeUserMenu();

    window.top?.location.reload();
}

function openUserMenu(): void {
    const parentDocument = getParentDocument();

    if (!parentDocument || !userMenuButton) {
        return;
    }

    closeUserMenu();
    createMenuStyles(parentDocument);

    const menu = parentDocument.createElement("div");

    menu.id = "gymcontrol-user-menu";
    menu.className = "gymcontrol-user-menu";

    menu.setAttribute(
        "role",
        "menu"
    );

    menu.innerHTML = `
        <a
            href="./perfil.html"
            class="gymcontrol-user-menu-item"
            role="menuitem"
        >
            Minha conta
        </a>

        <a
            href="./alterar-senha.html"
            class="gymcontrol-user-menu-item"
            role="menuitem"
        >
            Alterar senha
        </a>

        <div
            class="gymcontrol-user-menu-separator"
        ></div>

        <button
            type="button"
            class="
                gymcontrol-user-menu-item
                gymcontrol-user-menu-logout
            "
            id="gymcontrol-user-menu-logout"
            role="menuitem"
        >
            Sair
        </button>
    `;

    parentDocument.body.appendChild(menu);

    positionUserMenu(menu);

    userMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    const logoutButton =
        parentDocument.getElementById(
            "gymcontrol-user-menu-logout"
        ) as HTMLButtonElement | null;

    logoutButton?.addEventListener(
        "click",
        logout
    );
}

function toggleUserMenu(): void {
    const isOpen =
        userMenuButton?.getAttribute(
            "aria-expanded"
        ) === "true";

    if (isOpen) {
        closeUserMenu();
        return;
    }

    openUserMenu();
}

async function loadAuthenticatedUser(): Promise<void> {
    const accessToken =
        localStorage.getItem("access_token");

    if (!accessToken) {
        showUnloggedArea();
        return;
    }

    try {
        const response = await fetch(
            `${backendAddress}api/accounts/whoami/`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            removeTokens();
            showUnloggedArea();
            return;
        }

        const user =
            await response.json() as WhoAmIResponse;

        showLoggedArea(user.username);
    } catch (error: unknown) {
        console.error(
            "Erro ao buscar usuário autenticado:",
            error
        );

        showUnloggedArea();
    }
}

userMenuButton?.addEventListener(
    "click",
    (event: MouseEvent): void => {
        event.stopPropagation();
        toggleUserMenu();
    }
);

const parentDocument = getParentDocument();

parentDocument?.addEventListener(
    "mousedown",
    (event: MouseEvent): void => {
        const target = event.target as Node;
        const menu = getUserMenu();

        if (
            menu &&
            !menu.contains(target)
        ) {
            closeUserMenu();
        }
    }
);

parentDocument?.addEventListener(
    "keydown",
    (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            closeUserMenu();
        }
    }
);

window.parent.addEventListener(
    "resize",
    (): void => {
        closeUserMenu();
    }
);

window.parent.addEventListener(
    "scroll",
    (): void => {
        closeUserMenu();
    },
    true
);

void loadAuthenticatedUser();