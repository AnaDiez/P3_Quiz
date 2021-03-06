
//nuevo
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");

//nuevo
const {models} = require('./model');

// da error
exports.helpCmd = rl => {
    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

// nuevo-acabado
exports.listCmd = rl => {
    models.quiz.findAll()
    .each(quiz => {
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then( () =>{
        rl.prompt();
    })
};

// nuevo comando validaId
const validateId = id =>{
  return new Promise ((resolve, reject) =>{
    if(typeof id === "undefined"){
      reject (new Error(`Falta elparámetro <id>.`));
    }else{
      id = parseInt(id);
      if(Number.isNaN(id)){
        reject(new Error (`Elvalor delparámetro <id> no es un número`));
      }else{
        resolve(id);
      }
    }
  });

};


//nuevo-acabado
exports.showCmd = (rl, id) => {
    validateId(id)
    .then( id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz){
            throw new Error (`No existeun quiz asociado al id=${id}.`)
        }
        log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt()
    })
};


// nuevocomando makeQuestion
//error: return new Sequelize.Promise(blablabla)
const makeQuestion = (rl,text) =>{
  return new Sequelize.Promise((resolve,reject) => {
    rl.question(colorize(text + ': ','red'),answer => {
      resolve(answer.trim());
    });

  });
};

// nuevo-acabadoS
exports.addCmd = rl => {
  makeQuestion(rl,'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion (rl,'Introduzca la respuesta: ')
    .then(a => {
      return {question: q , answer: a};
    });
  })
  .then((quiz) => {
    log(` ${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo;');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });

};


// nuevo- acabado
exports.deleteCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
};


// nuevo- acabado
exports.editCmd = (rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz){
      throw new Error (`No existe un quiz asociado al id=${id}.`);
    }
    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl,' Introduzca la pregunta: ')
    .then ( q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
      return makeQuestion(rl,' Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por : ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)

  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};


// CAMBIAR
  exports.testCmd = (rl, id) => {
       if(typeof id ==="undefined"){
        errorlog (`Falta el parametro id.`);
        rl.prompt();
       }else{
        let pregunta;
        models.quiz.findById(id)
        .then(quiz => {
          pregunta=quiz;
        })
        .then(()=>{
        makeQuestion(rl,pregunta.question)
        .then(answer => {
          answer= answer.toLowerCase().trim();
          if (answer === pregunta.answer.toLowerCase().trim()){                   
            log(` correct `);
            rl.prompt();
          }else{
            log("incorrect");
            rl.prompt();         
          }
        });
       })
       .catch(e =>{
        errorlog("Error" +e);
        rl.prompt();
       });
   }
  };


//CAMBIAR
exports.playCmd = rl => {
     let score = 0;
     var i;
     let toBePlayed =[];
     
     const playOne = () =>{
      return new Promise (function (resolve,reject) {
      if(toBePlayed.length === 0){
      //Mensaje final del play
      log("Fin");
      log(` No hay más preguntas`);
      log(` Examen finalizado con : ${score} puntos`);
      biglog(score, 'magenta');
      resolve();
      return;
      }

      let pos = Math.floor(Math.random()*(toBePlayed.length-1));
      let quiz = toBePlayed[pos];
      toBePlayed.splice(pos,1);
      
      makeQuestion(rl,quiz.question)
      .then(answer => {
        answer= answer.toLowerCase().trim();
        if (answer === quiz.answer.toLowerCase().trim()){
          score ++;                    
          log(` correct `);
          log(`Lleva  ${score}  aciertos`);
          resolve(playOne());
        }else{
          log("incorrect");
          log("Fin ");
          log ("Aciertos: ");
          biglog(`${score}`, 'magenta'); 
          resolve();         
        }
      });
    });
  }

    models.quiz.findAll({raw : true})
    .then(quizzes => {
      toBePlayed = quizzes;
    })
    .then(() => {
      return playOne();
    })
    .catch(e =>{
      errorlog("Error" +e);
    })
    .then(()=>{
      rl.prompt();
    });
};



exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('ANA DÍEZ', 'green');
    rl.prompt();
};



exports.quitCmd = rl => {
    rl.close();
};

