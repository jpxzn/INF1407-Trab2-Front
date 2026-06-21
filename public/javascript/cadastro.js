import { backendAddress } from "./constantes.js";
const cadastroForm = document.getElementById("cadastro-form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordConfirmationInput = document.getElementById("password-confirmation");
const cadastroError = document.getElementById("cadastro-error");
const cadastroButton = document.getElementById("cadastro-button");
if (!cadastroForm ||
    !usernameInput ||
    !emailInput ||
    !passwordInput ||
    !passwordConfirmationInput ||
    !cadastroError ||
    !cadastroButton) {
    throw new Error("Elementos do formulário de cadastro não encontrados.");
}
function getErrorMessage(errors) {
    var _a, _b, _c, _d, _e, _f;
    const messages = [
        (_a = errors.username) === null || _a === void 0 ? void 0 : _a[0],
        (_b = errors.email) === null || _b === void 0 ? void 0 : _b[0],
        (_c = errors.password) === null || _c === void 0 ? void 0 : _c[0],
        (_d = errors.password_confirmation) === null || _d === void 0 ? void 0 : _d[0],
        (_e = errors.non_field_errors) === null || _e === void 0 ? void 0 : _e[0]
    ];
    return (_f = messages.find((message) => Boolean(message))) !== null && _f !== void 0 ? _f : "Não foi possível realizar o cadastro.";
}
cadastroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    cadastroError.textContent = "";
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirmation = passwordConfirmationInput.value;
    if (!username ||
        !email ||
        !password ||
        !passwordConfirmation) {
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
        const response = await fetch(`${backendAddress}api/accounts/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password,
                password_confirmation: passwordConfirmation
            })
        });
        if (!response.ok) {
            const errors = await response.json();
            cadastroError.textContent =
                getErrorMessage(errors);
            return;
        }
        window.location.href = "./login.html";
    }
    catch (error) {
        console.error("Erro ao realizar cadastro:", error);
        cadastroError.textContent =
            "Não foi possível conectar ao servidor.";
    }
    finally {
        cadastroButton.disabled = false;
        cadastroButton.textContent = "Criar conta";
    }
});
