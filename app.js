const modal = document.querySelector('.modal');
const from = document.querySelector('.form');
const inputtype = document.querySelector('.inputType');
const inputDistance = document.querySelector('.inputDistance');
const inputDurration = document.querySelector('.inputDurration');
const inputcadence = document.querySelector('.inputcadence');
const inputElevation = document.querySelector('.inputElevation');
const btnclose = document.querySelector('.btn-close');
const historybox = document.querySelector('.history');
const clearHistory = document.querySelector('.clearHistory');
let map, mapevent;

class App {
	#map;
	#mapevent;
	#workout = [];
	constructor() {
		this._getPossition();
		this._getLocalStorage();
		this._toggleElavationField();
		from.addEventListener('submit', this._newWorkOut.bind(this));
		historybox.addEventListener('click', this._moveToEL.bind(this));
		clearHistory.addEventListener('click', this._clearHistory.bind(this));
	}

	_getPossition() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
				alert('could not get your possition');
			});
		}
	}

	_loadMap(position) {
		let latitude = position.coords.latitude;
		let longitude = position.coords.longitude;
		let cords = [latitude, longitude];
		console.log(`https://www.google.com/maps/@${latitude},${longitude},12z`);

		this.#map = L.map('map').setView(cords, 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);

		this.#map.on('click', this._showForm.bind(this));
		this.#workout.forEach((item) => {
			this._rendermarker(item);
		});
	}

	_rendermarker(work) {
		L.marker(work.coods)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 200,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${work.type}-popup`,
				}),
			)
			.setPopupContent(`${work.type == 'running' ? '🚶‍♂️' : '🚴‍♂️ '} ${work.detail}`)
			.openPopup();
	}

	_showForm(mape) {
		modal.classList.toggle('d-block');
		modal.classList.toggle('show');
		inputDistance.focus();
		this.#mapevent = mape;
	}

	_toggleElavationField() {
		inputtype.addEventListener('change', (e) => {
			inputElevation.closest('.form-row').classList.toggle('d-none');
			inputcadence.closest('.form-row').classList.toggle('d-none');
		});
	}

	_newWorkOut(e) {
		e.preventDefault();

		let validInput = (...inputs) => inputs.every((value) => Number.isFinite(value));

		let allpositive = (...inputs) => inputs.every((inp) => inp > 0);
		// get data from form;
		let work,
			type = inputtype.value,
			duration = +inputDurration.value,
			distance = +inputDistance.value,
			{ lat: lat, lng: lng } = this.#mapevent.latlng;
		// check if data is valid

		// if workout runinng creat running object

		if (type == 'running') {
			let cadence = +inputcadence.value;
			if (
				!validInput(duration, distance, cadence) ||
				!allpositive(duration, distance, cadence)
			)
				return alert('input have to possition Number');

			work = new running([lat, lng], distance, duration, cadence);
		}

		// if workout cycling creat cycling object

		if (type == 'cycling') {
			let elevaion = +inputElevation.value;
			if (
				!validInput(duration, distance, elevaion) ||
				!allpositive(duration, distance, elevaion)
			)
				return alert('input have to possition Number');
			work = new cycling([lat, lng], distance, duration, elevaion);
		}

		this.#workout.push(work);

		// render workout on list
		this._rendermarker(work);
		hidemodal();
		this._renderWorkOut(work);
		this._setLocalStorage();
	}

	_renderWorkOut(work) {
		let html = `  <div class="div mt-5 cursor-pointer workout box bg-secondary px-6 py-4 rounded-1" data-id="${
			work.id
		}">
		<h4 class="fw-bold">${work.detail}</h4>
		<div class="between-center mt-4">
			<div class="between-center">
				${work.type == 'running' ? '🚶‍♂️' : '🚴‍♂️ '}
				<p class="mt-3px"><span> ${work.distance}</span> Km</p>
			</div>
			<div class="between-center">
				⌚
				<p class="mt-3px"><span>${work.duration}</span> min</p>
			</div>
			<div class="between-center">
			${work.type == 'running' ? "<i class='fas fa-shoe-prints me-2 fs-20'></i> " : '🤖'}
				<p class="mt-3px"><span>${work.type == 'running' ? work.cadence : work.elavation} </span> ${
			work.type == 'running' ? 'SPM' : 'M'
		}</p>
			</div>
	
		</div>
	</div>`;

		historybox.innerHTML += html;
	}

	_moveToEL(e) {
		let workoutEl = e.target.closest('.workout');

		const workobj = this.#workout.find((el) => el.id == workoutEl.dataset.id);

		this.#map.setView(workobj.coods, 13, {
			animate: true,
			pan: {
				duration: 1,
			},
		});
	}

	_setLocalStorage() {
		localStorage.setItem('workout', JSON.stringify(this.#workout));
	}

	_getLocalStorage() {
		let data = JSON.parse(localStorage.getItem('workout'));

		if (!data) return;
		this.#workout = data;

		this.#workout.forEach((item) => {
			this._renderWorkOut(item);
		});
	}

	_clearHistory() {
		this.#workout = [];
		localStorage.clear();
		historybox.innerHTML = '';
		location.reload();
	}
}

let app = new App();

// ///////////////////////////////

class WorkOut {
	date = new Date();
	id = (Date.now() + '').slice(-10);
	constructor(coods, distance, duration) {
		this.coods = coods;
		this.distance = distance;
		this.duration = duration;
	}
	_setDescription() {
		let month = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		this.detail = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
			month[this.date.getMonth()]
		} ${this.date.getDate()}  `;
	}
}

class cycling extends WorkOut {
	type = 'cycling';
	constructor(coods, distance, duration, elavation) {
		super(coods, distance, duration);
		this.elavation = elavation;
		this.pace();
		this._setDescription();
	}
	pace() {
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}

class running extends WorkOut {
	type = 'running';
	constructor(coods, distance, duration, cadence) {
		super(coods, distance, duration);
		this.cadence = cadence;
		this.calcSpeed();
		this._setDescription();
	}

	calcSpeed() {
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

// /////////////////////////////////////////
function hidemodal() {
	modal.classList.remove('d-block');
	modal.classList.remove('show');
}

btnclose.addEventListener('click', () => {
	hidemodal();
});
