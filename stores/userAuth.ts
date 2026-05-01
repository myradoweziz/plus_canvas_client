import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const authorizationToken = ref<string | null>(null);
  const getClientIp = computed(() => "");

  function setUserActivity(milliseconds: string) {
    localStorage.setItem("auth.person_last_activity", milliseconds);
  }

  function logout() {
    authorizationToken.value = null;
    localStorage.removeItem("authToken");
  }

  return {
    authorizationToken,
    getClientIp,
    setUserActivity,
    logout
  };
});
