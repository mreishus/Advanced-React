import Items from "../components/Items";
const Home = props => (
  <div>
    <Items page={parseFloat(props.query.page, 10) || 1} />
  </div>
);
export default Home;
