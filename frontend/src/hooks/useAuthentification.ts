import { useEffect, useState } from "react";
import type { Role } from "@shared/types/roles";
import type { verifyTokenBody, verifyTokenResponse } from "@shared/types/api/authApi";
import { api, AUTH_INVALID_EVENT } from "../services/apiService";

export function useAuthentification() {
    const [connecte, setConnecte] = useState(false);
    const [verification, setVerification] = useState(true);
    const [role, setRole] = useState<Role | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    const deconnecter = () => {
        localStorage.removeItem("token");
        setConnecte(false);
        setRole(null);
        setUsername(null);
        setVerification(false);
    };

    const connecter = (info: { role: Role; username: string }) => {
        setConnecte(true);
        setRole(info.role);
        setUsername(info.username);
    };

    useEffect(() => {
        window.addEventListener(AUTH_INVALID_EVENT, deconnecter);
        return () => window.removeEventListener(AUTH_INVALID_EVENT, deconnecter);
    }, []);

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setVerification(false);
                return;
            }

            const res = await api.post<verifyTokenBody, verifyTokenResponse>(
                "/auth/verifierToken",
                { token }
            );

            if (res.donnees?.success && res.donnees.role && res.donnees.username) {
                connecter({
                    role: res.donnees.role,
                    username: res.donnees.username
                });
            } else {
                deconnecter();
            }

            setVerification(false);
        })();
    }, []);

    return {
        connecte,
        verification,
        role,
        username,
        connecter,
        deconnecter
    };
}