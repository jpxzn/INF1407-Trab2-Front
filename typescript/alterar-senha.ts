import { backendAddress } from "./constantes.js";

interface ChangePasswordSuccessResponse {
    detail: string;
}

interface ChangePasswordErrorResponse {
    detail?: string;
    current_password?: string[];
    new_password?: string[];
    new_password_confirmation?: string[];
    non_field_errors?: string[];
}

const form = document.getElementById(
    "change-password-form"
) as HTMLFormElement | null;

const currentPasswordInput = document.getElementById(
    "current-password"
) as HTMLInputElement | null;

const newPasswordInput = document.getElementById(
    "new-password"
) as HTMLInputElement | null;

const confirmationInput = document.getElementById(
    "new-password-confirmation"
) as HTMLInputElement | null;

const formMessage = document.getElementById(
    "form-message"
) as HTMLParagraphElement | null;

const submitButton = document.getElementById(
    "submit-button"
) as HTMLButtonElement | null;

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function redirectToLogin(): void {
    window.location.replace("./login.html");
}

function requireAuthentication(): string | null {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        redirectToLogin();
        return null;
    }

    return accessToken;
}

function hideMessage(): void {
    formMessage?.classList.add("hidden");
}

function showMessage(
    message: string,
    type: "success" | "error"
): void {
    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;

    formMessage.classList.remove(
        "hidden",
        "success",
        "error"
    );

    formMessage.classList.add(type);
}

function setLoading(isLoading: boolean): void {
    if (!submitButton) {
        return;
    }

    submitButton.disabled = isLoading;

    submitButton.textContent = isLoading
        ? "Alterando..."
        : "Alterar senha";
}

function getErrorMessage(
    data: ChangePasswordErrorResponse
): string {
    if (data.current_password?.length) {
        return data.current_password[0];
    }

    if (data.new_password?.length) {
        return data.new_password.join(" ");
    }

    if (data.new_password_confirmation?.length) {
        return data.new_password_confirmation[0];
    }

    if (data.non_field_errors?.length) {
        return data.non_field_errors[0];
    }

    if (data.detail) {
        return data.detail;
    }

    return "Não foi possível alterar a senha.";
}

form?.addEventListener(
    "submit",
    async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();
        hideMessage();

        const accessToken = requireAuthentication();

        if (
            !accessToken ||
            !currentPasswordInput ||
            !newPasswordInput ||
            !confirmationInput
        ) {
            return;
        }

        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;

        const newPasswordConfirmation =
            confirmationInput.value;

        if (newPassword !== newPasswordConfirmation) {
            showMessage(
                "As novas senhas não coincidem.",
                "error"
            );

            confirmationInput.focus();
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(
                "A nova senha deve ser diferente da senha atual.",
                "error"
            );

            newPasswordInput.focus();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${backendAddress}api/accounts/change-password/`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        new_password_confirmation:
                            newPasswordConfirmation
                    })
                }
            );

            const data = await response.json() as
                | ChangePasswordSuccessResponse
                | ChangePasswordErrorResponse;

            if (response.status === 401) {
                removeTokens();

                alert(
                    "Sua sessão expirou. Faça login novamente."
                );

                redirectToLogin();
                return;
            }

            if (!response.ok) {
                showMessage(
                    getErrorMessage(
                        data as ChangePasswordErrorResponse
                    ),
                    "error"
                );

                return;
            }

            form.reset();

            showMessage(
                "Senha alterada com sucesso. Você será redirecionado para o login.",
                "success"
            );

            /*
             * Removemos os tokens para exigir que o usuário
             * entre novamente utilizando a nova senha.
             */
            removeTokens();

            window.setTimeout(
                redirectToLogin,
                1800
            );
        } catch (error: unknown) {
            console.error(
                "Erro ao alterar senha:",
                error
            );

            showMessage(
                "Não foi possível conectar ao servidor.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }
);

void requireAuthentication();