import { createStore } from "vuex";

const localStorageKey = 'DJsdfg-2352LLDSF-dfg*2fds#jis2';

export default createStore({
    state: {
        isAuthenticated: false,
        codcuenta: '',
        codcliente: '',
        codclienteAdmin: '',
        rol: '',
        ruc: '',
        codregla: [],
        email: '',
        selectedColumnsNotifications: [],
        empresa: '',
        username: '',
        usernameAdmin: '',
        eventAtended: {}
    },
    getters: {

    },
    mutations: {
        setIsAuthenticated(state, value) {
            state.isAuthenticated = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setCodCuenta(state, value) {
            state.codcuenta = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setRuc(state, value) {
            state.ruc = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setEventAtended(state, value) {
            state.eventAtended = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setSelectedColumnsNotifications(state, value) {
            state.selectedColumnsNotifications = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setCodCliente(state, value) {
            state.codcliente = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setCodClienteAdmin(state, value) {
            state.codclienteAdmin = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setRol(state, value) {
            state.rol = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setCodRegla(state, value) {
            state.codregla = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setEmpresa(state, value) {
            state.empresa = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setEmail(state, value) {
            state.email = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setUsername(state, value) {
            state.username = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },

        setUsernameAdmin(state, value) {
            state.usernameAdmin = value;
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        },
        // Agregar una mutación para inicializar el estado desde localStorage al cargar la página
        initializeStateFromLocalStorage(state) {
            const storedState = localStorage.getItem(localStorageKey);
            if (storedState) {
                Object.assign(state, JSON.parse(storedState));
            }
        }
    },
    actions: {
        initializeStateFromLocalStorage({ commit }) {
            commit('initializeStateFromLocalStorage');
        }
    }
})