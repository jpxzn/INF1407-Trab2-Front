import { backendAddress } from "./constantes.js";
const passwordResetForm = document.getElementById("password-reset-form");
const emailInput = document.getElementById("email");
const messageElement = document.getElementById("password-reset-message");
const submitButton = document.getElementById("password-reset-button");
if (!passwordResetForm ||
    !emailInput ||
    !messageElement ||
    !submitButton) {
    throw new Error("Elementos da página de recuperação não encontrados.");
}
passwordResetForm.addEventListener("submit", async (event) => {
    var _a, _b;
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
        const response = await fetch(`${backendAddress}api/accounts/password-reset/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email
            })
        });
        const data = await response.json();
        if (!response.ok) {
            if (data.email) {
                messageElement.textContent =
                    data.email.join(" ");
            }
            else {
                messageElement.textContent =
                    (_a = data.detail) !== null && _a !== void 0 ? _a : "Não foi possível solicitar a recuperação.";
            }
            return;
        }
        messageElement.textContent =
            (_b = data.detail) !== null && _b !== void 0 ? _b : "Código de recuperação solicitado com sucesso.";
        messageElement.className = "success";
    }
    catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        messageElement.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar código";
    }
});
