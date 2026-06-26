import { backendAddress } from "./constantes.js";

interface PasswordResetResponse {
    detail?: string;
    email?: string[];
}

const passwordResetForm = document.getElementById(
    "password-reset-form"
) as HTMLFormElement | null;

const emailInput = document.getElementById(
    "email"
) as HTMLInputElement | null;

const messageElement = document.getElementById(
    "password-reset-message"
) as HTMLParagraphElement | null;

const submitButton = document.getElementById(
    "password-reset-button"
) as HTMLButtonElement | null;

if (
    !passwordResetForm ||
    !emailInput ||
    !messageElement ||
    !submitButton
) {
    throw new Error(
        "Elementos da página de recuperação não encontrados."
    );
}

passwordResetForm.addEventListener(
    "submit",
    async (event): Promise<void> => {
        event.preventDefault();

        messageElement.textContent = "";
        messageElement.className = "error";

        const email = emailInput.value.trim();

        if (!email) {
            messageElement.textContent =
                "Informe seu e-mail.";

            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        try {
            const response = await fetch(
                `${backendAddress}api/accounts/password-reset/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data =
                await response.json() as PasswordResetResponse;

            if (!response.ok) {
                if (data.email) {
                    messageElement.textContent =
                        data.email.join(" ");
                } else {
                    messageElement.textContent =
                        data.detail ??
                        "Não foi possível solicitar a recuperação.";
                }

                return;
            }

            messageElement.textContent =
                data.detail ??
                "Código de recuperação solicitado com sucesso.";

            messageElement.className = "success";
        } catch (error: unknown) {
            console.error(
                "Erro ao solicitar recuperação:",
                error
            );

            messageElement.textContent =
                "Não foi possível conectar ao servidor.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar código";
        }
    }
);