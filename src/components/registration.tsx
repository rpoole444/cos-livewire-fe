
const RegistrationForm: React.FC = () => {
  // RegistrationForm state and logic here
  return (
    <form>
      <label htmlFor="#first-name"> first-name</label>
      <input 
        type="text"
        placeholder="Bob"
        id="first-name"
        name="first-name"
        />

      <label htmlFor="#last-name"> last-name</label>
      <input 
        type="text"
        placeholder="Marley"
        id="last-name"
        name="last-name"
        />

      <label htmlFor="#email"> Email</label>
      <input 
        type="text"
        placeholder="bob.marley@reggae.com"
        id="email"
        name="email"
        />

      <label htmlFor="#password"> Password</label>
      <input 
        type="text"
        placeholder="**********"
        id="password"
        name="password"
        />

        <br />

      <div style={{ display: "flex", justifyContent: "center" }}>
          <button type="submit">Submit</button>
      </div>
    </form>
  );
};

export default RegistrationForm;