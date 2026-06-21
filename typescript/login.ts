import { backendAddress } from "./constantes.js";

interface TokenResponse {
    access: string;
    refresh: string;
}

const loginForm = document.getElementById(
    "login-form"
) as HTMLFormElement | null;

const usernameInput = document.getElementById(
    "username"
) as HTMLInputElement | null;

const passwordInput = document.getElementById(
    "password"
) as HTMLInputElement | null;

const loginError = document.getElementById(
    "login-error"
) as HTMLParagraphElement | null;

const loginButton = document.getElementById(
    "login-button"
) as HTMLButtonElement | null;

if (
    !loginForm ||
    !usernameInput ||
    !passwordInput ||
    !loginError ||
    !loginButton
) {
    throw new Error("Elementos do formulário de login não encontrados.");
}

loginForm.addEventListener("submit", async (event): Promise<void> => {
    event.preventDefault();

    loginError.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        loginError.textContent = "Preencha o usuário e a senha.";
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";

    try {
        const response = await fetch(
            `${backendAddress}api/token/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        if (!response.ok) {
            loginError.textContent = "Usuário ou senha inválidos.";
            return;
        }

        const tokens = await response.json() as TokenResponse;

        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);

        window.location.href = "./index.html";
    } catch (error: unknown) {
        console.error("Erro ao realizar login:", error);

        loginError.textContent =
            "Não foi possível conectar ao servidor.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Entrar";
    }
});