const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');

/**
 * Muestra la ayuda
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */

exports.helpCmd = rl => {
    log("Comandos:");
    log("   h|help - Muestra esta ayuda.");
    log("   list - Listar los quizzes existentes.");
    log("   show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("   add - Añadir un nuevo quiz interactivamente.");
    log("   delete <id> - Borrar el quiz indicado.");
    log("   edit <id> - Editar el quiz indicado.");
    log("   test <id> - Probar el quiz indicado.");
    log("   p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("   credits - Créditos.");
    log("   q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
    rl.prompt();
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog('Falta el parámetro id.');
	}else{
		try{
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		}catch(error){
			errorlog(error.message);
		}
	}


    rl.prompt();
};


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.addCmd = rl => {
	rl.question(colorize('Introduzca una pregunta: ', 'red'), question =>{
		rl.question(colorize('Introduzca una respuesta: ', 'red'), answer =>{
			model.add(question, answer);
			log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
	if (typeof id === "undefined") {
		errorlog('Falta el parámetro id.');
	}else{
		try{
			const quiz = model.getByIndex(id);
			log(`El quiz '${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}' ha sido borrado satisfactoriamente. `);
			model.deleteByIndex(id);
		}catch(error){
			errorlog(error.message);
		}
	}
    rl.prompt();
};


/**
 * Edita un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog('Falta el parámetro id.');
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);
			const pregunta = quiz.question;
			const respuesta = quiz.answer;

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
			rl.question(colorize('Introduzca una pregunta: ', 'red'), question =>{

				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
				rl.question(colorize('Introduzca una respuesta: ', 'red'), answer =>{
					model.update(id, question, answer);
					log(`Se ha cambiado el quiz '[${colorize(id, 'magenta')}] ${pregunta} ${colorize('=>', 'magenta')} ${respuesta}' por: '[${colorize(id, 'magenta')}] ${question} ${colorize('=>', 'magenta')} ${answer}'`);
					rl.prompt();
				});
			});
		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}
};




/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a probar
 */
exports.testCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog('Falta el parámetro id.');
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);
			const pregunta = quiz.question;
			rl.question(colorize(pregunta + '?', 'red'), answer =>{
				const resp = (answer || "").trim()
				if ( resp === quiz.answer){
					biglog('CORRECTO', 'green');
					rl.prompt();
				}else{
					biglog('INCORRECTO', 'red');
					rl.prompt();
				}
			});

		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}
};




//SIN HACER
/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = []; // array que guarda ids de todas las preguntas que existen

	var cuenta = model.count();
	while (cuenta>0) {
    	toBeResolved[cuenta-1] = cuenta-1;
    	cuenta--; 
  	}


  	const playOne = ()=> {
		if ( toBeResolved.length == 0){
			console.log("No hay preguntas para responder.");
			console.log("La puntuación obtenida es de: ");
			biglog(score, 'red');
			rl.prompt();
		}else{
			let rand = Math.trunc(Math.random()*toBeResolved.length);
			let id = toBeResolved[rand];
			let quiz = model.getByIndex(id);
			let pregunta = quiz.question;
			
			rl.question(colorize(pregunta + '?', 'red'), answer =>{
				const resp = (answer || "").trim()
				if ( resp === quiz.answer){
					score++;
					biglog('CORRECTO', 'green');
					console.log("Tu puntuación es: ");
					biglog(score,'yellow');
					toBeResolved.splice(rand,1);
					playOne();
				}else{
					biglog('INCORRECTO', 'red');
					console.log("Se acabó el juego, su puntuación ha sido: ");
					biglog(score,'yellow');
					rl.prompt();
				}
			});
		}
    }
    playOne();
};



/**
 * Muestra los nombre de los autores de la práctica.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica: ');
    log('   Jose Ignacio Villegas Villegas');
    rl.prompt();
};



/**
 * Terminar el programa.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.quitCmd = rl => {
    rl.close();
};