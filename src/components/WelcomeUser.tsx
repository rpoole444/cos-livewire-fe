import Link from "next/link";
import { logoutUser } from "@/pages/api/route";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";


const WelcomeUser = () =>{
  const { user, logout} = useAuth()
  const router = useRouter()
  
  const handleLogout = async () => {
    try {  
      // await logoutUser()
        logout()
        router.push('/')
    } catch (err) {
      console.error(err)
    }
  };
  console.log(user)
  return (
    <>
      <h1 className="text-center text-sm md:text-base lg:text-lg p-2 bg-blue-100 text-blue-900 font-semibold rounded-md shadow">
          Welcome! You are logged in.
      </h1>
      <br/>
      <Link href="/eventSubmission" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Submit Event
      </Link>
      <button  onClick={handleLogout} className="mt-4 text-blue-500">
        Logout
      </button>
    </>
  )

}

export default WelcomeUser;