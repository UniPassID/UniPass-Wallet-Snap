export const useRecoveryStore = defineStore({
  id: 'recoveryStore',
  state: () => {
    return {
      email: '',
      token: '',
      password: '',
      confirmPassword: '',
      step: 1,
      loading: false,
    }
  },
  actions: {},
})
