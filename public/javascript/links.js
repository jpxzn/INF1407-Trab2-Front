import { backendAddress } from "./constantes.js";
const unloggedArea = document.getElementById("unlogged");
const loggedArea = document.getElementById("logged");
const userName = document.getElementById("user-name");
const logoutLink = document.getElementById("logout");
function showUnloggedArea() {
    unloggedArea === null || unloggedArea === void 0 ? void 0 : unloggedArea.classList.remove("hidden");
    loggedArea === null || loggedArea === void 0 ? void 0 : loggedArea.classList.add("hidden");
}
function showLoggedArea(username) {
    unloggedArea === null || unloggedArea === void 0 ? void 0 : unloggedArea.classList.add("hidden");
    loggedArea === null || loggedArea === void 0 ? void 0 : loggedArea.classList.remove("hidden");
    if (userName) {
        userName.textContent = `Olá, ${username}`;
    }
}
function removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}
async function loadAuthenticatedUser() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        showUnloggedArea();
        return;
    }
    try {
        const response = await fetch(`${backendAddress}api/accounts/whoami/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            removeTokens();
            showUnloggedArea();
            return;
        }
        const user = await response.json();
        showLoggedArea(user.username);
    }
    catch (error) {
        console.error("Erro ao buscar usuário autenticado:", error);
        showUnloggedArea();
    }
}
logoutLink === null || logoutLink === void 0 ? void 0 : logoutLink.addEventListener("click", (event) => {
    var _a;
    event.preventDefault();
    removeTokens();
    (_a = window.top) === null || _a === void 0 ? void 0 : _a.location.reload();
});
void loadAuthenticatedUser();
