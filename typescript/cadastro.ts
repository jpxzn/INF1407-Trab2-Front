import { backendAddress } from "./constantes.js";

interface CadastroErrors {
    username?: string[];
    email?: string[];
    password?: string[];
    password_confirmation?: string[];
    non_field_errors?: string[];
}

const cadastroForm = document.getElementById(
    "cadastro-form"
) as HTMLFormElement | null;

const usernameInput = document.getElementById(
    "username"
) as HTMLInputElement | null;

const emailInput = document.getElementById(
    "email"
) as HTMLInputElement | null;

const passwordInput = document.getElementById(
    "password"
) as HTMLInputElement | null;

const passwordConfirmationInput = document.getElementById(
    "password-confirmation"
) as HTMLInputElement | null;

const cadastroError = document.getElementById(
    "cadastro-error"
) as HTMLParagraphElement | null;

const cadastroButton = document.getElementById(
    "cadastro-button"
) as HTMLButtonElement | null;

if (
    !cadastroForm ||
    !usernameInput ||
    !emailInput ||
    !passwordInput ||
    !passwordConfirmationInput ||
    !cadastroError ||
    !cadastroButton
) {
    throw new Error(
        "Elementos do formulário de cadastro não encontrados."
    );
}

function getErrorMessage(errors: CadastroErrors): string {
    const messages = [
        errors.username?.[0],
        errors.email?.[0],
        errors.password?.[0],
        errors.password_confirmation?.[0],
        errors.non_field_errors?.[0]
    ];

    return messages.find(
        (message): message is string => Boolean(message)
    ) ?? "Não foi possível realizar o cadastro.";
}

cadastroForm.addEventListener(
    "submit",
    async (event): Promise<void> => {
        event.preventDefault();

        cadastroError.textContent = "";

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirmation =
            passwordConfirmationInput.value;

        if (
            !username ||
            !email ||
            !password ||
            !passwordConfirmation
        ) {
            cadastroError.textContent =
                "Preencha todos os campos.";

            return;
        }

        if (password !== passwordConfirmation) {
            cadastroError.textContent =
                "As senhas não coincidem.";

            return;
        }

        cadastroButton.disabled = true;
        cadastroButton.textContent = "Criando conta...";

        try {
            const response = await fetch(
                `${backendAddress}api/accounts/register/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        password_confirmation:
                            passwordConfirmation
                    })
                }
            );

            if (!response.ok) {
                const errors =
                    await response.json() as CadastroErrors;

                cadastroError.textContent =
                    getErrorMessage(errors);

                return;
            }

            window.location.href = "./login.html";
        } catch (error: unknown) {
            console.error(
                "Erro ao realizar cadastro:",
                error
            );

            cadastroError.textContent =
                "Não foi possível conectar ao servidor.";
        } finally {
            cadastroButton.disabled = false;
            cadastroButton.textContent = "Criar conta";
        }
    }
);