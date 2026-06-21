import { backendAddress } from "./constantes.js";
const form = document.getElementById("profile-form");
const loadingMessage = document.getElementById("loading-message");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const studentFields = document.getElementById("student-fields");
const userTypeElement = document.getElementById("user-type");
const formMessage = document.getElementById("form-message");
const saveButton = document.getElementById("save-button");
let currentUserType = null;
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
function redirectToLogin() {
    window.location.replace("./login.html");
}
function getAccessToken() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        redirectToLogin();
        return null;
    }
    return accessToken;
}
function showMessage(message, type) {
    if (!formMessage) {
        return;
    }
    formMessage.textContent = message;
    formMessage.classList.remove("hidden", "success", "error");
    formMessage.classList.add(type);
}
function hideMessage() {
    formMessage === null || formMessage === void 0 ? void 0 : formMessage.classList.add("hidden");
}
function setLoading(isLoading) {
    if (!saveButton) {
        return;
    }
    saveButton.disabled = isLoading;
    saveButton.textContent = isLoading
        ? "Salvando..."
        : "Salvar alterações";
}
function showForm() {
    loadingMessage === null || loadingMessage === void 0 ? void 0 : loadingMessage.classList.add("hidden");
    form === null || form === void 0 ? void 0 : form.classList.remove("hidden");
}
function showStudentFields(shouldShow) {
    if (shouldShow) {
        studentFields === null || studentFields === void 0 ? void 0 : studentFields.classList.remove("hidden");
        return;
    }
    studentFields === null || studentFields === void 0 ? void 0 : studentFields.classList.add("hidden");
}
function populateProfile(profile) {
    var _a, _b;
    currentUserType = profile.tipo_usuario;
    if (usernameInput) {
        usernameInput.value = profile.username;
    }
    if (emailInput) {
        emailInput.value = profile.email;
    }
    if (userTypeElement) {
        userTypeElement.textContent =
            profile.tipo_usuario === "admin"
                ? "Administrador"
                : "Aluno";
        userTypeElement.classList.remove("hidden");
    }
    const isStudent = profile.tipo_usuario === "aluno";
    showStudentFields(isStudent);
    if (isStudent) {
        if (weightInput) {
            weightInput.value = (_a = profile.peso) !== null && _a !== void 0 ? _a : "";
        }
        if (heightInput) {
            heightInput.value = (_b = profile.altura) !== null && _b !== void 0 ? _b : "";
        }
    }
    showForm();
}
function getErrorMessage(data) {
    var _a, _b, _c, _d, _e;
    if ((_a = data.username) === null || _a === void 0 ? void 0 : _a.length) {
        return data.username.join(" ");
    }
    if ((_b = data.email) === null || _b === void 0 ? void 0 : _b.length) {
        return data.email.join(" ");
    }
    if ((_c = data.peso) === null || _c === void 0 ? void 0 : _c.length) {
        return data.peso.join(" ");
    }
    if ((_d = data.altura) === null || _d === void 0 ? void 0 : _d.length) {
        return data.altura.join(" ");
    }
    if ((_e = data.non_field_errors) === null || _e === void 0 ? void 0 : _e.length) {
        return data.non_field_errors.join(" ");
    }
    if (Array.isArray(data.detail)) {
        return data.detail.join(" ");
    }
    if (typeof data.detail === "string") {
        return data.detail;
    }
    return "Não foi possível atualizar o perfil.";
}
async function parseJsonResponse(response) {
    var _a;
    const contentType = (_a = response.headers.get("content-type")) !== null && _a !== void 0 ? _a : "";
    if (!contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Resposta inesperada do servidor:", response.status, responseText);
        return null;
    }
    return await response.json();
}
async function loadProfile() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return;
    }
    try {
        const response = await fetch(`${backendAddress}api/accounts/profile/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }
        const data = await parseJsonResponse(response);
        if (!data) {
            throw new Error(`Resposta inválida: ${response.status}`);
        }
        if (!response.ok) {
            showMessage(getErrorMessage(data), "error");
            loadingMessage === null || loadingMessage === void 0 ? void 0 : loadingMessage.classList.add("hidden");
            return;
        }
        populateProfile(data);
    }
    catch (error) {
        console.error("Erro ao carregar perfil:", error);
        if (loadingMessage) {
            loadingMessage.textContent =
                "Não foi possível carregar o perfil.";
        }
    }
}
form === null || form === void 0 ? void 0 : form.addEventListener("submit", async (event) => {
    var _a, _b;
    event.preventDefault();
    hideMessage();
    const accessToken = getAccessToken();
    if (!accessToken ||
        !usernameInput ||
        !emailInput) {
        return;
    }
    const requestBody = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
    };
    if (currentUserType === "aluno") {
        const weightValue = (_a = weightInput === null || weightInput === void 0 ? void 0 : weightInput.value.trim()) !== null && _a !== void 0 ? _a : "";
        const heightValue = (_b = heightInput === null || heightInput === void 0 ? void 0 : heightInput.value.trim()) !== null && _b !== void 0 ? _b : "";
        requestBody.peso =
            weightValue === ""
                ? null
                : weightValue;
        requestBody.altura =
            heightValue === ""
                ? null
                : heightValue;
    }
    setLoading(true);
    try {
        const response = await fetch(`${backendAddress}api/accounts/profile/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });
        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }
        const data = await parseJsonResponse(response);
        if (!data) {
            showMessage(response.status === 404
                ? "O endpoint de perfil não foi encontrado no backend."
                : `O servidor retornou o erro ${response.status}.`, "error");
            return;
        }
        if (!response.ok) {
            showMessage(getErrorMessage(data), "error");
            return;
        }
        populateProfile(data);
        showMessage("Perfil atualizado com sucesso.", "success");
        /*
         * Recarrega depois de um momento para o novo
         * username também aparecer no cabeçalho.
         */
        window.setTimeout(() => {
            window.location.reload();
        }, 1200);
    }
    catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showMessage("Não foi possível conectar ao servidor.", "error");
    }
    finally {
        setLoading(false);
    }
});
void loadProfile();
