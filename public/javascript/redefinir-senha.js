import { backendAddress } from "./constantes.js";
const resetForm = document.getElementById("password-reset-confirm-form");
const codeInput = document.getElementById("code");
const newPasswordInput = document.getElementById("new-password");
const newPasswordConfirmationInput = document.getElementById("new-password-confirmation");
const messageElement = document.getElementById("password-reset-confirm-message");
const submitButton = document.getElementById("password-reset-confirm-button");
if (!resetForm ||
    !codeInput ||
    !newPasswordInput ||
    !newPasswordConfirmationInput ||
    !messageElement ||
    !submitButton) {
    throw new Error("Elementos da página de redefinição não encontrados.");
}
function getErrorMessage(data) {
    var _a;
    if (data.code) {
        return data.code.join(" ");
    }
    if (data.new_password) {
        return data.new_password.join(" ");
    }
    if (data.new_password_confirmation) {
        return data.new_password_confirmation.join(" ");
    }
    return ((_a = data.detail) !== null && _a !== void 0 ? _a : "Não foi possível redefinir a senha.");
}
resetForm.addEventListener("submit", async (event) => {
    var _a;
    event.preventDefault();
    messageElement.textContent = "";
    messageElement.className = "error";
    const code = codeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const newPasswordConfirmation = newPasswordConfirmationInput.value;
    if (!code ||
        !newPassword ||
        !newPasswordConfirmation) {
        messageElement.textContent =
            "Preencha todos os campos.";
        return;
    }
    if (newPassword.length < 8) {
        messageElement.textContent =
            "A nova senha deve ter pelo menos 8 caracteres.";
        return;
    }
    if (newPassword !==
        newPasswordConfirmation) {
        messageElement.textContent =
            "As senhas não coincidem.";
        return;
    }
    submitButton.disabled = true;
    submitButton.textContent = "Redefinindo...";
    try {
        const response = await fetch(`${backendAddress}api/accounts/password-reset/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation
            })
        });
        const data = await response.json();
        if (!response.ok) {
            messageElement.textContent =
                getErrorMessage(data);
            return;
        }
        messageElement.textContent =
            (_a = data.detail) !== null && _a !== void 0 ? _a : "Senha redefinida com sucesso.";
        messageElement.className = "success";
        resetForm.reset();
        setTimeout(() => {
            window.location.href = "./login.html";
        }, 2000);
    }
    catch (error) {
        console.error("Erro ao redefinir senha:", error);
        messageElement.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "Redefinir senha";
    }
});
