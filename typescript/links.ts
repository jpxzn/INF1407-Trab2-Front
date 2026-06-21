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

const logoutLink = document.getElementById(
    "logout"
) as HTMLAnchorElement | null;

function showUnloggedArea(): void {
    unloggedArea?.classList.remove("hidden");
    loggedArea?.classList.add("hidden");
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

async function loadAuthenticatedUser(): Promise<void> {
    const accessToken = localStorage.getItem("access_token");

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
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            removeTokens();
            showUnloggedArea();
            return;
        }

        const user = await response.json() as WhoAmIResponse;

        showLoggedArea(user.username);
    } catch (error: unknown) {
        console.error(
            "Erro ao buscar usuário autenticado:",
            error
        );

        showUnloggedArea();
    }
}

logoutLink?.addEventListener(
    "click",
    (event: MouseEvent): void => {
        event.preventDefault();

        removeTokens();

        window.top?.location.reload();
    }
);

void loadAuthenticatedUser();