import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';

import Header from "../components/Header";
import NavBar from "../components/NavBar";
import ParkingLotCard from '../components/ParkingLotCard';

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { collection, addDoc, onSnapshot } from "firebase/firestore"; 
import { db } from '../firebase/firebase';

// const parkingLots = ["ryerson_lot.jpg", "pearson_lot.jpg"];
const style = {
  alignItems: "center",
  justifyContent: "center",
  overflow: "auto",
};

function Home() {
  const [parkingLots, setParkingLots] = useState();
  const docRef = collection(db, `parking_lots`);

  useEffect(() => {
    const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
      const parkingLotsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      console.log(parkingLotsData);
      setParkingLots(parkingLotsData);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  // const { currentUser, signOut } = useContext(AuthContext);

  return (
    <Paper style={{ maxHeight: "100%" }}>
      <Header title={"Parking Lot"} />
      <CssBaseline />
      <Paper sx={style} elevation={3}>
        <List>
          {parkingLots?.map(({id, name, img, description}) => (
            <ParkingLotCard key={id} name={name} img={img} description={description} />
          ))}
        </List>
      </Paper>
      <NavBar />
    </Paper>
  );
}
export default Home;
