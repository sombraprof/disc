// English comments inside code.
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('disciplines-container');
  const footer = document.querySelector('footer p');

  // Remove compact density to use normal spacing
  if (container && container.hasAttribute('data-density')) {
    container.removeAttribute('data-density');
  }

  try {
    const response = await fetch('/public/disciplines.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const disciplines = await response.json();

    if (!Array.isArray(disciplines) || disciplines.length === 0) {
      footer.textContent = 'Nenhuma disciplina encontrada.';
      return;
    }

    // Clear loading state
    container.innerHTML = '';

    const frag = document.createDocumentFragment();

    disciplines.forEach((discipline) => {
      const card = document.createElement('a');
      card.href = `/index.html?course=${encodeURIComponent(discipline.id)}`;
      card.className = 'card block text-left list-view'; // Added list-view

      // Accent only on the left border
      if (discipline.themeColor) {
        card.style.borderLeftColor = discipline.themeColor;
      }

      // Top code (course short name)
      const code = document.createElement('p');
      // Use semantic compact class (no big bottom margin)
      code.className = 'card-code';
      code.textContent = discipline.code;

      // Title (2-line clamp to keep height consistent)
      const name = document.createElement('h2');
      name.className = 'card-title line-clamp-2';
      name.textContent = discipline.name;

      card.appendChild(code);
      card.appendChild(name);

      // Optional: description if available in JSON
      if (discipline.description) {
        const desc = document.createElement('p');
        desc.className = 'card-desc';
        desc.textContent = discipline.description;
        card.appendChild(desc);
      }

      frag.appendChild(card);
    });

    container.appendChild(frag);
    footer.textContent = 'Selecione uma disciplina para começar.';
  } catch (error) {
    console.error('Erro ao carregar a lista de disciplinas:', error);
    footer.textContent = 'Erro ao carregar disciplinas. Verifique o console.';
    container.innerHTML =
      '<p class="text-red-500 col-span-full">Não foi possível carregar a lista de disciplinas. Tente recarregar a página.</p>';
  }
});
