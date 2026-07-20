import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios'
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL
export const AppContext = createContext();

export const AppProvider = ({children}) => {

    const [isAdmin, setIsAdmin] = useState(false)
    const [shows, setShows] = useState([])
    const [faviouriteMovies, setFavouriteMovies] = useState([])

    const navigate = useNavigate()
    const location = useLocation()
    const {user} = useUser();
    const {getToken} = useAuth()

    const fetchIsAdmin = async () => {
        try {
            const {data} = await axios.get('/api/admin/is-admin', {headers: {
                Authorization: `Bearer ${await getToken()}`}})
            setIsAdmin(data.isAdmin)
            
            if(!data.isAdmin && location.pathname.startsWith('/admin')){
                navigate('/')
                toast.error("You are not authorized to access admin dashboard")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchShows = async () => {
        try {
            // we will get the shows data from api response and we will use the setter function to store the data in shows state
            const {data} = await axios.get('/api/show/all')
            if(data.success){
                setShows(data.shows)
            } else{
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchFaviouriteShows = async () => {
        try {
            const {data} = await axios.get('/api/user/faviourites', {headers: {
                Authorization: `Bearer ${await getToken()}`}})
            if(data.success){
                setFavouriteMovies(data.movies)
            } else{
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(()=> {
        fetchShows()
    },[])

    useEffect(() => {
        if(user) {
            fetchIsAdmin()
            fetchFaviouriteShows()
        }   
    },[user])

    const value = {
        axios,
        fetchIsAdmin,
        user, getToken, navigate, isAdmin,
        shows, faviouriteMovies, fetchFaviouriteShows
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)