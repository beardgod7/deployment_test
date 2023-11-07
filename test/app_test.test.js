const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);

describe('POST /create-user', () => {
  it('should create a user and return a success response', (done) => {
    chai
      .request(server)
      .post("/api/v2/user/create-user")
      .send({
        Email: 'testuser@example.com',
        Password: 'testpassword',
      })
      .end((err, res) => {
        expect(res).to.have.status(201); // Expect a 201 (Created) status code
        expect(res.body).to.have.property('success').to.be.true;
        expect(res.body).to.have.property('message').to.include('please check your email');
        done();
      });
  });


  it('should return an error response if required fields are missing', (done) => {
    chai
      .request(server)
      .post("/api/v2/user/create-user")
      .send({}) // Missing required fields
      .end((err, res) => {
        expect(res).to.have.status(400); // Expect a 400 (Bad Request) status code
        expect(res.body).to.have.property('message').to.equal('All required fields must be provided.');
        done();
      });
  });

  // Add more test cases for edge cases or other scenarios as needed.
});





