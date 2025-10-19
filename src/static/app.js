document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        // Create participants list element so we can attach event listeners
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsContainer.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (details.participants && details.participants.length) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Email text
            const span = document.createElement("span");
            span.textContent = p;
            span.className = "participant-email";

            // Delete button (simple ×)
            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            delBtn.textContent = "×";

            // Attach click handler to unregister
            delBtn.addEventListener("click", async () => {
              if (!confirm(`Unregister ${p} from ${name}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: "POST" }
                );

                const result = await res.json();
                if (res.ok) {
                  // Remove the list item from the DOM
                  li.remove();

                  // If list becomes empty, show 'No participants yet'
                  if (ul.querySelectorAll('li').length === 0) {
                    const no = document.createElement('li');
                    no.className = 'no-participants';
                    no.textContent = 'No participants yet';
                    ul.appendChild(no);
                  }
                } else {
                  alert(result.detail || 'Failed to unregister');
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                alert('Failed to unregister. Please try again.');
              }
            });

            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.className = 'no-participants';
          li.textContent = 'No participants yet';
          ul.appendChild(li);
        }

        participantsContainer.appendChild(ul);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Update the DOM to show the new participant without refresh
        // Find the activity card by name
        const cards = document.querySelectorAll('.activity-card');
        let matchedCard = null;
        cards.forEach(c => {
          const h4 = c.querySelector('h4');
          if (h4 && h4.textContent === activity) matchedCard = c;
        });

        if (matchedCard) {
          const ul = matchedCard.querySelector('.participants-list');
          if (ul) {
            // Remove 'no-participants' placeholder if present
            const placeholder = ul.querySelector('.no-participants');
            if (placeholder) placeholder.remove();

            // create list item similarly to initial render
            const createParticipantListItem = (email, activityName, ulElement) => {
              const li = document.createElement("li");
              li.className = "participant-item";

              const span = document.createElement("span");
              span.textContent = email;
              span.className = "participant-email";

              const delBtn = document.createElement("button");
              delBtn.className = "participant-delete";
              delBtn.setAttribute("aria-label", `Unregister ${email} from ${activityName}`);
              delBtn.textContent = "×";

              delBtn.addEventListener("click", async () => {
                if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

                try {
                  const res = await fetch(
                    `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                    { method: "POST" }
                  );

                  const result = await res.json();
                  if (res.ok) {
                    li.remove();
                    if (ulElement.querySelectorAll('li').length === 0) {
                      const no = document.createElement('li');
                      no.className = 'no-participants';
                      no.textContent = 'No participants yet';
                      ulElement.appendChild(no);
                    }
                  } else {
                    alert(result.detail || 'Failed to unregister');
                  }
                } catch (err) {
                  console.error('Error unregistering:', err);
                  alert('Failed to unregister. Please try again.');
                }
              });

              li.appendChild(span);
              li.appendChild(delBtn);
              return li;
            };

            const newLi = createParticipantListItem(email, activity, ul);
            ul.appendChild(newLi);
          }

          // update availability text: decrement spots left
          const avail = matchedCard.querySelector('.availability');
          if (avail) {
            const parts = avail.textContent.match(/(\d+) spots left/);
            if (parts) {
              const current = parseInt(parts[1], 10);
              avail.textContent = `${Math.max(0, current - 1)} spots left`;
            }
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
