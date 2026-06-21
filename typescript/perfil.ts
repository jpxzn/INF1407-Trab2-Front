import { backendAddress } from "./constantes.js";

type UserType = "aluno" | "admin";

interface ProfileResponse {
    id: number;
    username: string;
    email: string;
    tipo_usuario: UserType;
    peso?: string | null;
    altura?: string | null;
}

interface ProfileErrorResponse {
    detail?: string | string[];
    username?: string[];
    email?: string[];
    peso?: string[];
    altura?: string[];
    non_field_errors?: string[];
}

const form = document.getElementById(
    "profile-form"
) as HTMLFormElement | null;

const loadingMessage = document.getElementById(
    "loading-message"
) as HTMLDivElement | null;

const usernameInput = document.getElementById(
    "username"
) as HTMLInputElement | null;

const emailInput = document.getElementById(
    "email"
) as HTMLInputElement | null;

const weightInput = document.getElementById(
    "weight"
) as HTMLInputElement | null;

const heightInput = document.getElementById(
    "height"
) as HTMLInputElement | null;

const studentFields = document.getElementById(
    "student-fields"
) as HTMLDivElement | null;

const userTypeElement = document.getElementById(
    "user-type"
) as HTMLSpanElement | null;

const formMessage = document.getElementById(
    "form-message"
) as HTMLParagraphElement | null;

const saveButton = document.getElementById(
    "save-button"
) as HTMLButtonElement | null;

let currentUserType: UserType | null = null;

function removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function redirectToLogin(): void {
    window.location.replace("./login.html");
}

function getAccessToken(): string | null {
    const accessToken =
        localStorage.getItem("access_token");

    if (!accessToken) {
        redirectToLogin();
        return null;
    }

    return accessToken;
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

function hideMessage(): void {
    formMessage?.classList.add("hidden");
}

function setLoading(isLoading: boolean): void {
    if (!saveButton) {
        return;
    }

    saveButton.disabled = isLoading;

    saveButton.textContent = isLoading
        ? "Salvando..."
        : "Salvar alterações";
}

function showForm(): void {
    loadingMessage?.classList.add("hidden");
    form?.classList.remove("hidden");
}

function showStudentFields(
    shouldShow: boolean
): void {
    if (shouldShow) {
        studentFields?.classList.remove("hidden");
        return;
    }

    studentFields?.classList.add("hidden");
}

function populateProfile(
    profile: ProfileResponse
): void {
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

    const isStudent =
        profile.tipo_usuario === "aluno";

    showStudentFields(isStudent);

    if (isStudent) {
        if (weightInput) {
            weightInput.value = profile.peso ?? "";
        }

        if (heightInput) {
            heightInput.value = profile.altura ?? "";
        }
    }

    showForm();
}

function getErrorMessage(
    data: ProfileErrorResponse
): string {
    if (data.username?.length) {
        return data.username.join(" ");
    }

    if (data.email?.length) {
        return data.email.join(" ");
    }

    if (data.peso?.length) {
        return data.peso.join(" ");
    }

    if (data.altura?.length) {
        return data.altura.join(" ");
    }

    if (data.non_field_errors?.length) {
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

async function parseJsonResponse<T>(
    response: Response
): Promise<T | null> {
    const contentType =
        response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
        const responseText = await response.text();

        console.error(
            "Resposta inesperada do servidor:",
            response.status,
            responseText
        );

        return null;
    }

    return await response.json() as T;
}

async function loadProfile(): Promise<void> {
    const accessToken = getAccessToken();

    if (!accessToken) {
        return;
    }

    try {
        const response = await fetch(
            `${backendAddress}api/accounts/profile/`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (response.status === 401) {
            removeTokens();
            redirectToLogin();
            return;
        }

        const data =
            await parseJsonResponse<
                ProfileResponse | ProfileErrorResponse
            >(response);

        if (!data) {
            throw new Error(
                `Resposta inválida: ${response.status}`
            );
        }

        if (!response.ok) {
            showMessage(
                getErrorMessage(
                    data as ProfileErrorResponse
                ),
                "error"
            );

            loadingMessage?.classList.add("hidden");
            return;
        }

        populateProfile(
            data as ProfileResponse
        );
    } catch (error: unknown) {
        console.error(
            "Erro ao carregar perfil:",
            error
        );

        if (loadingMessage) {
            loadingMessage.textContent =
                "Não foi possível carregar o perfil.";
        }
    }
}

form?.addEventListener(
    "submit",
    async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();
        hideMessage();

        const accessToken = getAccessToken();

        if (
            !accessToken ||
            !usernameInput ||
            !emailInput
        ) {
            return;
        }

        const requestBody: {
            username: string;
            email: string;
            peso?: string | null;
            altura?: string | null;
        } = {
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
        };

        if (currentUserType === "aluno") {
            const weightValue =
                weightInput?.value.trim() ?? "";

            const heightValue =
                heightInput?.value.trim() ?? "";

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
            const response = await fetch(
                `${backendAddress}api/accounts/profile/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (response.status === 401) {
                removeTokens();
                redirectToLogin();
                return;
            }

            const data =
                await parseJsonResponse<
                    ProfileResponse | ProfileErrorResponse
                >(response);

            if (!data) {
                showMessage(
                    response.status === 404
                        ? "O endpoint de perfil não foi encontrado no backend."
                        : `O servidor retornou o erro ${response.status}.`,
                    "error"
                );

                return;
            }

            if (!response.ok) {
                showMessage(
                    getErrorMessage(
                        data as ProfileErrorResponse
                    ),
                    "error"
                );

                return;
            }

            populateProfile(
                data as ProfileResponse
            );

            showMessage(
                "Perfil atualizado com sucesso.",
                "success"
            );

            /*
             * Recarrega depois de um momento para o novo
             * username também aparecer no cabeçalho.
             */
            window.setTimeout(
                (): void => {
                    window.location.reload();
                },
                1200
            );
        } catch (error: unknown) {
            console.error(
                "Erro ao atualizar perfil:",
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

void loadProfile();