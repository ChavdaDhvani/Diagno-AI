var symps = [];  // Store selected symptoms
var sbox = document.getElementById("sbox");

$(document).ready(function () {
    $("input").typeahead({
        source: symp_list,
        minLength: 2
    });

    if (!localStorage.getItem("key")) {
        introJs().start();
        localStorage.setItem("key", "keyValue");
    }
});
function startHelp() {
    setTimeout(function () {
        introJs().setOptions({
            showStepNumbers: true,
            showBullets: true,
            exitOnOverlayClick: false, // Prevent accidental close
            disableInteraction: false, // Allow interactions
            steps: [
    
             
                {
                    element: "#symptom",  
                    intro: "Enter your symptoms",
                    position: "bottom"
                },
                {
                    element: ".input-group-append button",  
                    intro: "Add any number of symptoms",
                    position: "bottom"
                },
                {
                    element: "#find_out",  
                    intro: "Add and wait",
                    position: "bottom"
                },
               
            ]
        }).start();
    }, 500); 
}


// Function to add a new symptom when "YES" is clicked
function appendNewSymp(symptom) {
    if (!symps.includes(symptom)) {
        symps.push(symptom);

        // Append to "Your Symptoms" card with a remove button
        $("#positive").append(`
            <span class="badge badge-secondary m-1" id="symp-${symptom}">
                ${symptom} 
               
            </span>
        `);

        // Show "Your Symptoms" card if hidden
        $("#your-symptoms-card").show();
    }

    // Remove the suggestion card after selection
    $("#" + symptom).fadeOut(300, function () { $(this).remove(); });
}

// Function to remove a symptom when "NO" is clicked (removes from suggestion list only)
function removeSymp(symptom) {
    $("#" + symptom).fadeOut(300, function () { $(this).remove(); });
}

// Function to remove a symptom from "Your Symptoms" card
function removeSympFromSelected(symptom) {
    symps = symps.filter(s => s !== symptom);
    $("#symp-" + symptom).fadeOut(300, function () { $(this).remove(); });

    // Hide "Your Symptoms" card if no symptoms left
    if (symps.length === 0) {
        $("#your-symptoms-card").hide();
    }
}// Function to add a new symptom when "YES" is clicked
function appendNewSymp(symptom) {
    if (!symps.includes(symptom)) {
        symps.push(symptom);

        // Append to "Your Symptoms" card with a remove button
        $("#positive").append(`
            <span class="badge badge-secondary m-1" id="symp-${symptom.replace(/\s+/g, '-')}">
                ${symptom} 
                <a href="#" class="text-danger ml-1" onclick="removeSympFromSelected('${symptom}');">✖</a>
            </span>
        `);

        // Show "Your Symptoms" card if hidden
        $("#your-symptoms-card").show();
    }

    // Remove the suggestion card with fadeOut effect
    let cardID = "#" + CSS.escape(symptom);
    if ($(cardID).length) {
        $(cardID).fadeOut(300, function () { $(this).remove(); });
    }
}

// Function to remove a symptom when "NO" is clicked
function removeSymp(symptom) {
    let cardID = "#" + CSS.escape(symptom);
    if ($(cardID).length) {
        $(cardID).fadeOut(300, function () { $(this).remove(); });
    }
}

// Function to remove a symptom from "Your Symptoms" card
function removeSympFromSelected(symptom) {
    symps = symps.filter(s => s !== symptom);
    let badgeID = "#symp-" + symptom.replace(/\s+/g, '-');
    if ($(badgeID).length) {
        $(badgeID).fadeOut(300, function () { $(this).remove(); });
    }

    // Hide "Your Symptoms" card if no symptoms left
    if (symps.length === 0) {
        $("#your-symptoms-card").hide();
    }
}



// Function to add symptoms manually
function appendSymp() {
    var a = $("#symptom").val().trim();
    if (a === "") {
        alert("Please enter a symptom.");
        return;
    }
    symps.push(a);
    $("#tags").append(`<span class="badge badge-secondary m-1">${a}</span>`);
    $("#symptom").val("");
    
    // Show "Your Symptoms" card if not already displayed
    $("#your-symptoms-card").show();
}

// Event listener for "Find Out" button (fetches symptom suggestions)
document.getElementById("find_out").addEventListener("click", function () {
    fetch("/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symps }),
    })
    .then(response => response.json())
    .then(data => {
        let cardsDiv = document.getElementById("cards");
        cardsDiv.innerHTML = "";  // Clear previous suggestions

        if (data.error) {
            console.error("Error:", data.error);
            alert("Failed to load symptoms!");
            return;
        }

        if (data.suggested_symptoms.length === 0) {
            cardsDiv.innerHTML = "<p>No additional symptoms found.</p>";
            return;
        }

        // Display suggested symptoms dynamically
        data.suggested_symptoms.forEach(symptom => {
            let cardHtml = `
                <div class="card w-75 center text-center shadow p-3 mb-3 bg-white rounded" id="${symptom}">
                    <div class="card-body">
                        <p class="card-title">Do you have/feel?</p>
                        <h5 class="card-text">${symptom}</h5>
                        <a class="btn btn-success" onclick="appendNewSymp('${symptom}');"> YES </a>
                        <a class="btn btn-danger" onclick="removeSymp('${symptom}');"> NO </a>
                    </div>
                </div>`;
            
            cardsDiv.innerHTML += cardHtml;
        });

        $("html, body").animate({
            scrollTop: $("#cards").offset().top
        }, 800); // 800ms smooth scroll
        

    })
    .catch(error => console.error("Error:", error));
});

// Event listener for "SEARCH" button (finds possible disease based on selected symptoms)
document.getElementById("disease").addEventListener("click", function () {
    fetch("/disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symps }),
    })
    .then(response => response.text())
    .then(html => {
        document.open();
        document.write(html);
        document.close();
    })
    .catch(error => console.error("Error:", error));
});

function showDis(data) {
    $("#cards").empty();
    $("#details").empty();
    $("#details").append('<h1 class="boxy text-white text-center"><b>It is most probably ' + data + '.</b></h1><br/><br/><a href="." class="btn btn-outline-light btn-lg">BACK</a>');
}

// Image upload feature
$("#but_upload").click(function () {
    var fd = new FormData();
    var files = $('#file')[0].files[0];

    if (!files) {
        alert("Please insert an image");
    } else {
        fd.append('file', files);
        $("#details").append('<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>');
        
        $.ajax({
            url: '/image',
            type: 'post',
            data: fd,
            contentType: false,
            processData: false,
            success: function (response) {
                console.log(response);
                RecieveFunc(response);
            }
        });
    }
});

// Google Calendar Integration
var CLIENT_ID = '686668170446-90dc678t33eiobahgan5qte8aod8nq1a.apps.googleusercontent.com';
var API_KEY = 'AIzaSyBs9ZaCKkEMP7AdJWzDylVKFw_zJ7UzPHE';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        console.error(JSON.stringify(error, null, 2));
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        listUpcomingEvents();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

function listUpcomingEvents() {
    gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
    }).then(function (response) {
        var events = response.result.items;
        appendPre('Upcoming events:');

        if (events.length > 0) {
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var when = event.start.dateTime;
                if (!when) {
                    when = event.start.date;
                }
                appendPre(event.summary + ' (' + when + ')');
            }
        } else {
            appendPre('No upcoming events found.');
        }
    });
};
