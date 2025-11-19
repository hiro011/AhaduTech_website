// Fetch data from your Netlify Function (DB backend)
    async function loadUsers() {
      try {
        const response = await fetch('/api/get-users');  // Relative URL works on Netlify
        if (!response.ok) throw new Error('Failed to fetch');
        
        const users = await response.json();
        const list = document.getElementById('users-list');
        
        users.forEach(user => {
          const li = document.createElement('li');
          li.textContent = user.name;  // Adjust based on your data
          list.appendChild(li);
        });
      } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = '<li>Error loading data</li>';
      }
    }

    // Load on page ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadUsers);
    } else {
      loadUsers();
    }