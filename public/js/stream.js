/**
 * This javascript is your first ever custom javascript that will run before anything else.
 * Think about the sequence of your scripts
 */

/**
 * Initialization function after all HTML elements are loaded.
 * This is called before the loading of images stylesheets
 * @param {Event} event The triggered dom event
 */
document.addEventListener("DOMContentLoaded", function (event) {
	console.log("DOM Initialized");
});

/**
 * Initialization function after everything is loaded.
 * This event should be used for stuff that probably need to wait for dynamic contents
 * @param {Event} event The triggered dom event
 */
window.addEventListener("load", function (event) {
	console.log("HTML Initialized");
	const socket = io();
	const data   = new Credentials(this.document.getElementById("data"));
	const stream = new LiveStream(data, socket);
});

class Credentials {
	/**
	 * @param {HTMLElement} dataElement The HTML element containing attributes for data
	 */
	constructor(dataElement) {
		/** @readonly @type {string} */
		this.streamId = dataElement.getAttribute("streamId");
		/** @readonly @type {"HOST"|"GUEST"} */
		this.role = dataElement.getAttribute("role");
		/** @readonly @type {string} */
		this.userId = dataElement.getAttribute("userId");
		/** @readonly @type {string} */
		this.username = dataElement.getAttribute("username");
		/** @readonly @type {string} */
		this.token = dataElement.getAttribute("token");
	}
}

/**
 * The live stream object used to handle broadcasting
 */
class LiveStream {
	
	/**
	 * @param {Credentials}                credentials	Current user credentials
	 * @param {import('socket.io').Socket} socket		The opened socket shared with chat service
	 */
	constructor(credentials, socket) {
		this.socket      = socket;
		this.credentials = credentials;

		this.socket.on("host_joined",       this.onHostJoined.bind(this));
		this.socket.on("guest_joined",      this.onGuestJoined.bind(this));
		this.socket.on("webrtc_start",      this.on_rtc_start.bind(this));
		this.socket.on("webrtc_offer",      this.on_rtc_offer.bind(this));
		this.socket.on("webrtc_answer",     this.on_rtc_answer.bind(this));
		this.socket.on("webrtc_ice_config", this.on_rtc_ice_config.bind(this));
		this.socket.emit("join",            this.credentials.token);
	}

	async onHostJoined()  {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					aspectRatio: 1.778,
					height     : { ideal: 1080, min: 480},
					resizeMode : { ideal: "crop-and-scale" }
				},
				audio: true
			});
			this.displayVideo.srcObject = stream;
			this.displayVideo.muted     = this.isHost;
			this.displayVideo.volume    = (this.isHost)? 0 : this.displayVideo.volume;
		}
		catch (error) {
			console.error(error);
		}
	}

	async onGuestJoined() {
		try {
			this.socket.emit('webrtc_start', this.credentials.streamId);
		}
		catch (error) {
			console.error(error);
		}
	}

	/**
	 * Assign the remote stream object
	 * @param {RTCTrackEvent} event 
	 */
	connect_remote(event) {
		console.log('Connect remote');
		

		if (this.displayVideo.srcObject) {
			console.log(`Added track ${event.track.kind} from stream ${event.streams[0].id}`);
			this.displayVideo.srcObject.addTrack(event.track);
		}
		else {
			console.log(`Assigned stream ${event.streams[0].id}`);
			this.displayVideo.srcObject = event.streams[0];
		}
	}

	/**
	 * Emit ICE candidate events
	 * @param {RTCPeerConnectionIceEvent} event 
	 */
	connect_ice(event) {
		console.log('Connect ice');
		if (event.candidate != null) {
			console.log(`Configure ice`);
			console.log(event);
			this.socket.emit("webrtc_ice_config", {
				streamId : this.credentials.streamId,
				label    : event.candidate.sdpMLineIndex,
				candidate: event.candidate.candidate
			});
		}
	}

	/**
	 * 
	 * @param {RTCSessionDescriptionInit} event 
	 */
	async on_rtc_start(event) {
		console.log("RTC Start");
		this.rtc = new RTCPeerConnection(this.ICEServers);
		// this.rtc.ontrack        = this.connect_remote.bind(this);
		this.rtc.onicecandidate = this.connect_ice.bind(this);
		
		/** @type {MediaStream} */
		const stream = this.displayVideo.srcObject;

		for (const track of stream.getTracks()) {
			this.rtc.addTrack(track, stream);
		}

		try {
			const session = await this.rtc.createOffer();
			await this.rtc.setLocalDescription(session);
			this.socket.emit("webrtc_offer", {
				type    : "webrtc_offer",
				sdp     : session,
				streamId: this.credentials.streamId
			});
		}
		catch (error) {
			console.error("Failed to start live streaming");
			console.error(error);
		}
	}

	/**
	 * When a offer to establish connection is received, send a answer to the host
	 * @param {RTCSessionDescriptionInit} event The incoming RTC event
	 */
	async on_rtc_offer(event) {
		console.log("RTC Offer");
		this.rtc                = new RTCPeerConnection(this.ICEServers);
		this.rtc.ontrack        = this.connect_remote.bind(this);
		this.rtc.onicecandidate = this.connect_ice.bind(this);
		await this.rtc.setRemoteDescription(new RTCSessionDescription(event));
		
		try {
			const session = await this.rtc.createAnswer();
			await this.rtc.setLocalDescription(session);
			this.socket.emit("webrtc_answer", {
				type    : "webrtc_answer",
				sdp     : session,
				streamId: this.credentials.streamId
			});
		}
		catch (error) {
			console.error("Failed to watch live streaming");
			console.error(error);
		}
	}

	/**
	 * 
	 * @param {RTCSessionDescriptionInit} event 
	 */
	async on_rtc_answer(event) {
		console.log("RTC Answer");
		await this.rtc.setRemoteDescription(new RTCSessionDescription(event));
	}

	/**
	 * Configure the ICE candidates
	 * @param {} event 
	 */
	async on_rtc_ice_config(event) {
		console.log("RTC Ice Config");
		console.log(event);
		const candidate = new RTCIceCandidate({
			sdpMLineIndex: event.label,
			candidate    : event.candidate
		});
		await this.rtc.addIceCandidate(candidate);
	}

	/** @type {HTMLVideoElement} */
	get displayVideo() { return document.getElementById("video-remote"); }
	get containerText() { return document.getElementById("container-chat"); }
	/** @type {boolean} */
	get isHost()        { return this.credentials.role === "HOST"; }
	get isGuest()       { return this.credentials.role === "GUEST"; }

	/**
	 * Free public STUN servers provided by Google.
	 */
	get ICEServers()    { return { iceServers: [
				{ urls: 'stun:stun.l.google.com:19302'  },
				{ urls: 'stun:stun1.l.google.com:19302' },
				{ urls: 'stun:stun2.l.google.com:19302' },
				{ urls: 'stun:stun3.l.google.com:19302' },
				{ urls: 'stun:stun4.l.google.com:19302' }
			]
		};
	}
}