ARG ARTEFACT_ID
FROM nestjs/cli:${ARTEFACT_ID}
WORKDIR /tests
COPY . .
RUN npm install --production 
CMD npm start -s
