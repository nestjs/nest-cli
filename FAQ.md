# How to migrate v1 to v2 ?
Follow the official Nestjs project structure to move your architecture assets :

#### Move v1 structure
```
    src
     |
     - - server.ts 
     |
     - - app
          |
          - - app.module.ts
          |
          - - modules
                 |
                 - - module1
                        |
                        - - module1.module.ts
                        |
                        - - controllers
                        |        |
                        |        - - controller1
                        |                |
                        |                - - controller1.controller.ts
                        |                |
                        |                - - controller1.controller.spec.ts
                        |
                        - - services
                                 |
                                 - - service1
                                         |
                                         - - service1.service.ts
                                         |
                                         - - service1.service.spec.ts
```  
#### To v2 structure
```
    src
     |
     - - server.ts 
     |
     - - modules
          |
          - - app.module.ts
          |
          - - app.controller.ts
          |
          - - module1
                 |
                 - - module1.module.ts
                 |
                 - - controller1.controller.ts
                 |                
                 - - controller1.controller.spec.ts
                 |
                 - - service1.service.ts
                 |
                 - - service1.service.spec.ts
```