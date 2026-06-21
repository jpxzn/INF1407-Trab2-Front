import { backendAddress } from "./constantes.js";
const form = document.getElementById("change-password-form");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmationInput = document.getElementById("new-password-confirmation");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
function redirectToLogin() {
    window.location.replace("./login.html");
}
function requireAuthentication() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        redirectToLogin();
        return null;
    }
    return accessToken;
}
function hideMessage() {
    formMessage === null || formMessage === void 0 ? void 0 : formMessage.classList.add("hidden");
}
function showMessage(message, type) {
    if (!formMessage) {
        return;
    }
    formMessage.textContent = message;
    formMessage.classList.remove("hidden", "success", "error");
    formMessage.classList.add(type);
}
function setLoading(isLoading) {
    if (!submitButton) {
        return;
    }
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading
        ? "Alterando..."
        : "Alterar senha";
}
function getErrorMessage(data) {
    var _a, _b, _c, _d;
    if ((_a = data.current_password) === null || _a === void 0 ? void 0 : _a.length) {
        return data.current_password[0];
    }
    if ((_b = data.new_password) === null || _b === void 0 ? void 0 : _b.length) {
        return data.new_password.join(" ");
    }
    if ((_c = data.new_password_confirmation) === null || _c === void 0 ? void 0 : _c.length) {
        return data.new_password_confirmation[0];
    }
    if ((_d = data.non_field_errors) === null || _d === void 0 ? void 0 : _d.length) {
        return data.non_field_errors[0];
    }
    if (data.detail) {
        return data.detail;
    }
    return "Não foi possível alterar a senha.";
}
form === null || form === void 0 ? void 0 : form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage();
    const accessToken = requireAuthentication();
    if (!accessToken ||
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmationInput) {
        return;
    }
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const newPasswordConfirmation = confirmationInput.value;
    if (newPassword !== newPasswordConfirmation) {
        showMessage("As novas senhas não coincidem.", "error");
        confirmationInput.focus();
        return;
    }
    if (currentPassword === newPassword) {
        showMessage("A nova senha deve ser diferente da senha atual.", "error");
        newPasswordInput.focus();
        return;
    }
    setLoading(true);
    try {
        const response = await fetch(`${backendAddress}api/accounts/change-password/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation
            })
        });
        const data = await response.json();
        if (response.status === 401) {
            removeTokens();
            alert("Sua sessão expirou. Faça login novamente.");
            redirectToLogin();
            return;
        }
        if (!response.ok) {
            showMessage(getErrorMessage(data), "error");
            return;
        }
        form.reset();
        showMessage("Senha alterada com sucesso. Você será redirecionado para o login.", "success");
        /*
         * Removemos os tokens para exigir que o usuário
         * entre novamente utilizando a nova senha.
         */
        removeTokens();
        window.setTimeout(redirectToLogin, 1800);
    }
    catch (error) {
        console.error("Erro ao alterar senha:", error);
        showMessage("Não foi possível conectar ao servidor.", "error");
    }
    finally {
        setLoading(false);
    }
});
void requireAuthentication();
