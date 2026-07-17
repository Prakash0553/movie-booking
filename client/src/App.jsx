import React from 'react'
import Navbar from './components/Navbar'
import Home  from './pages/Home'
import { Route, Routes, useLocation } from 'react-router-dom'
import Movies from './pages/Movies'
import MyBookings from './pages/MyBookings'
import SeatLayout from './pages/SeatLayout'
import MovieDetails from './pages/MovieDetails'
import Footer from './components/Footer'
import {Toaster} from 'react-hot-toast'
import Favourite from './pages/Favourite'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
const App = () => {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  return (
    <>

    <Toaster/>
    {!isAdmin && <Navbar/>}
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/movies' element={<Movies/>}/>
      <Route path='/movies/:id' element={<MovieDetails/>}/>
      <Route path='/movies/:id/:date' element={<SeatLayout/>}/>
      <Route path='/my-bookings' element={<MyBookings/>}/>
      <Route path='/favourites' element={<Favourite/>}/>

      {/* Admin */}
      <Route path='/admin/*' element={<Layout/>}>
         <Route index element={<Dashboard/>}/>
         <Route path='add-shows' element={<AddShows/>}/>
         <Route path='list-shows' element={<ListShows/>}/>
         <Route path='list-bookings' element={<ListBookings/>}/>
      </Route>
    </Routes>
    {!isAdmin && <Footer/>}
    </>
  )
}

export default App