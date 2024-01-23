import axios from "axios";

export const baseUrl = `${process.env.REACT_APP_PROTOCOL}://${process.env.REACT_APP_BASE_URL}`;
export const apiUrl = `${baseUrl}/api`;
export const wsUrl = `${process.env.REACT_APP_WS_PROTOCOL}://${process.env.REACT_APP_BASE_URL}/api`;

export const createHttp = () => {
    const accessToken = localStorage.getItem("pop-access-token");

    const instance = axios.create({
        baseURL: apiUrl,
        responseType: "json",
        headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    instance.interceptors.response.use(
        function (response) {
            return response;
        },
        function (error) {
            if (error.response.status === 401) {
                localStorage.setItem("pop-access-token", "");
            }

            return Promise.reject(error);
        },
    );

    return instance;
};
