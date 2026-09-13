import { useEffect, useState } from "react";
import { toast } from "sonner";
import {useMutation} from "convex/react";
import {useQuery} from "convex/react";


//useConvexQuery → GET data....
export const useConvexQuery = (query , ...args) => {
    const result = useQuery(query, ...args);

    const [data,setData] = useState(undefined);
    const [isloading,setIsLoading] = useState(true);
    const [error,setError] = useState(null);

    useEffect(() => {
       if(result === undefined){
        setIsLoading(true);
       }
       else{
 try {
    setData(result);
    setError(null);
 } catch (error) {
    setError(error);
    toast.error(error.message || "An error occurred");
 } finally {
    setIsLoading(false);
 }
       }
    }, [result])

    return {data,isloading,error};
}





//useConvexMutation → CHANGE data....
export const useConvexMutation = (mutation) => {
    const mutationfnc = useMutation(mutation);

    const [data,setData] = useState(undefined);
    const [isloading,setIsLoading] = useState(true);
    const [error,setError] = useState(null);

    const mutate = async(...args) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await mutationfnc(...args);
            setData(response);
            return response;
        } catch (error) {
            setError(error);
            toast.error(error.message || "An error occurred");
        }  finally {
            setIsLoading(false);
        }
    };

    return {mutate,data,isloading,error};
}