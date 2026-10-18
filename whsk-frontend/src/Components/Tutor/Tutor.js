import React, { useState, useEffect } from "react";
import axios from "axios";
import Tutor_card from "./Tutor_card.js";
import "./Tutor.css";
import ImgCart from "./imagesTest/profile-picture.jpg";
import { Input, Button } from "antd";
import Loading from "../Loading/Loading";
import { Link } from "react-router-dom";
import apiList, { server } from "../../lib/apiList.js";
// import { ThumbDown } from "@mui/icons-material";

const Tutor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [tutors, setTutors] = useState([]);
  //console.log(Tutor_card);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${apiList.tutor}?status=accepted`);

        setTutors(data.docs);
      } catch (error) {
        //console.log(error);
      }
    })();
  }, []);

  const listItems = tutors.map((item) => (
    <div className="card-tutor" key={item.id}>
      <div className="card_img">
        <img src={`${server}/${item?.userId?.imageUrl}`} />
      </div>
      <div className="card-tutor_header">
        <h2 className="card-tutor_header-h2">{item?.userId?.username}</h2>
        <p className="card-tutor_header-p">{item?.moreInfo}</p>
        <p className="price">
          {item.hskLevel}
          <span className="card-tutor_header-span">{item.currency}</span>
        </p>
        <div>{/* <ThumbDown /> */}</div>
        <Link to="/tutorDetails">
          <div className="btn-cart-tutor">View Details</div>
        </Link>
      </div>
    </div>
  ));
  return isLoading ? (
    <Loading></Loading>
  ) : (
    <div className="tutor-container">
      <div className="tutor-link">
        <Link to="/becomeTutor">
          <span>Do you want to become a volunteer tutor?</span>
        </Link>
        <Link to="/tutorDashboard">
          <Button className="btn btn-primary">Tutor Dashboard</Button>
        </Link>
      </div>

      <Input className="form-input" placeholder="search for tutor by name..." />
      <div className="tutor-main_content">
        {/* <h3>Headphones</h3> */}
        {listItems}
        {/* <h1 className="loading-h1" style={{ paddingLeft: "50%" }}>
          loading..
        </h1> */}
      </div>
    </div>
  );
};
export default Tutor;
