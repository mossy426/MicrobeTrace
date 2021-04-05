(function () {
  ga('set', 'page', '/files');
  ga('set', 'title', 'Files View');
  ga('send', 'pageview');

  'use strict';

  $('#file-panel').parent().css('z-index', 1000);

  $('#file-settings-toggle').on('click', function () {
    const pane = $('#file-settings-pane');
    if ($(this).hasClass('active')) {
      pane.animate({ left: '-400px' }, () => pane.hide());
    } else {
      pane.show(0, () => pane.animate({ left: '0px' }));
    }
  });

  if (session.files.length > 0) {
    $('#file-prompt, #warning-prompt').remove();
    session.files.forEach(addToTable);
  }

  $('#data-files').on('change', function () {
    processFiles(this.files);
  });

  $('#file-panel').on('dragover', evt => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.originalEvent.dataTransfer.dropEffect = 'copy';
  }).on('drop', evt => {
    evt.stopPropagation();
    evt.preventDefault();
    processFiles(evt.originalEvent.dataTransfer.files);
  });

  function processFiles(files){
    const n = files.length;
    $('#file-prompt, #warning-prompt').remove();
    for (let i = 0; i < n; i++) processFile(files[i]);
    $('#launch').prop('disabled', false).focus();
  }

  function processFile(rawfile) {
    const extension = rawfile.name.split('.').pop().toLowerCase();
    if (extension == 'zip') {
      let new_zip = new JSZip();
      new_zip
        .loadAsync(rawfile)
        .then(zip => {
          zip.forEach((relativePath, zipEntry) => {
            zipEntry.async("string").then(c => {
              MT.processJSON(c, zipEntry.name.split('.').pop())
            });
          });
        });
      return;
    }
    if (extension == 'microbetrace' || extension == 'hivtrace') {
      let reader = new FileReader();
      reader.onloadend = out => MT.processJSON(out.target.result, extension);
      reader.readAsText(rawfile, 'UTF-8');
      return;
    }
    if (extension == 'svg') {
      let reader = new FileReader();
      reader.onloadend = out => MT.processSVG(out.target.result);
      reader.readAsText(rawfile, 'UTF-8');
      return;
    }
    fileto.promise(rawfile, (extension == 'xlsx' || extension == 'xls') ? 'ArrayBuffer' : 'Text').then(file => {
      file.name = filterXSS(file.name);
      file.extension = file.name.split('.').pop().toLowerCase();
      session.files.push(file);
      addToTable(file);
    });
  }

  function addToTable(file) {
    const extension = file.extension ? file.extension : filterXSS(file.name).split('.').pop().toLowerCase();
    //#291 restore to previous filetype selection if available
    const isFasta = 'fasta' == file.format || extension.indexOf('fas') > -1;
    const isNewick = 'newick' == file.format ||extension.indexOf('nwk') > -1 || extension.indexOf('newick') > -1;
    const isXL = (extension == 'xlsx' || extension == 'xls');
    const isNode = 'node' == file.format || file.name.toLowerCase().includes('node');
    if (isXL) {
      let workbook = XLSX.read(file.contents, { type: 'array' });
      let data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {raw: false, dateNF: 'yyyy-mm-dd'});
      let headers = [];
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          const safeKey = filterXSS(key);
          if (!headers.includes(safeKey)) headers.push(safeKey);
        });
      });
      addTableTile(headers);
    } else {
      Papa.parse(file.contents, {
        delimiter: ",",
        // newline: "\r\n",
        header: true,
        preview: 1,
        complete: output => addTableTile(output.meta.fields.map(filterXSS))
      });
    }
    //For the love of all that's good...
    //TODO: Rewrite this as a [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) or [something](https://reactjs.org/docs/react-component.html) or something.
    function addTableTile(headers) {
      let root = $('<div class="file-table-row"></div>').data('filename', file.name);
      let fnamerow = $('<div class="row w-100"></div>');
      $('<div class="file-name col"></div>')
        .append($('<a href="#" class="oi oi-circle-x align-middle p-1" title="Remove this file"></a>').on('click', () => {
          session.files.splice(session.files.findIndex(f => f.name == file.name), 1);
          root.slideUp(() => root.remove());
        }))
        .append($('<a href="#" class="oi oi-data-transfer-download align-middle p-1" title="Resave this file"></a>').on('click', () => {
          saveAs(new Blob([file.contents], { type: file.type | 'text' }), file.name);
        }))
        .append('<span class="p-1">' + file.name + '</span>')
        .append(`
      <div class="btn-group btn-group-toggle btn-group-sm float-right" data-toggle="buttons">
        <label class="btn btn-light${!isFasta & !isNewick & !isNode ? ' active' : ''}">
          <input type="radio" name="options-${file.name}" data-type="link" autocomplete="off"${!isFasta & !isNewick & !isNode ? ' checked' : ''}>Link
        </label>
        <label class="btn btn-light${!isFasta & !isNewick & isNode ? ' active' : ''}">
          <input type="radio" name="options-${file.name}" data-type="node" autocomplete="off"${!isFasta & !isNewick & isNode ? ' checked' : ''}>Node
        </label>
        <label class="btn btn-light">
          <input type="radio" name="options-${file.name}" data-type="matrix" autocomplete="off">Matrix
        </label>
        <label class="btn btn-light${isFasta ? ' active' : ''}">
          <input type="radio" name="options-${file.name}" data-type="fasta" autocomplete="off"${isFasta ? ' checked' : ''}>FASTA
        </label>
        <label class="btn btn-light${isNewick ? ' active' : ''}">
          <input type="radio" name="options-${file.name}" data-type="newick" autocomplete="off"${isNewick ? ' checked' : ''}>Newick
        </label>
      </div>
      `).appendTo(fnamerow);
      fnamerow.appendTo(root);
      let optionsrow = $('<div class="row w-100"></div>');
      let options = '<option>None</option>' + headers.map(h => `<option value="${h}">${MT.titleize(h)}</option>`).join('\n');
      optionsrow.append(`
    <div class='col-4 '${isFasta || isNewick ? ' style="display: none;"' : ''} data-file='${file.name}'>
      <label for="file-${file.name}-field-1">${isNode ? 'ID' : 'Source'}</label>
      <select id="file-${file.name}-field-1" class="form-control form-control-sm">${options}</select>
    </div>
    <div class='col-4 '${isFasta || isNewick ? ' style="display: none;"' : ''} data-file='${file.name}'>
      <label for="file-${file.name}-field-2">${isNode ? 'Sequence' : 'Target'}</label>
      <select id="file-${file.name}-field-2" class="form-control form-control-sm">${options}</select>
    </div>
    <div class='col-4 '${isFasta || isNewick ? ' style="display: none;"' : ''} data-file='${file.name}'>
      <label for="file-${file.name}-field-3">Distance</label>
      <select id="file-${file.name}-field-3" class="form-control form-control-sm">${options}</select>
    </div>
    `);
      optionsrow.appendTo(root);

      function matchHeaders(type) {
        const these = $(`[data-file='${file.name}'] select`);
        if(file.field1) {
          //#291 restore to previous variable selection if available
          $(these.get(0)).val(file.field1);
          $(these.get(1)).val(file.field2);
          $(these.get(2)).val(file.field3);
        } else {
          const a = type == 'node' ? ['ID', 'Id', 'id'] : ['SOURCE', 'Source', 'source'],
            b = type == 'node' ? ['SEQUENCE', 'SEQ', 'SEQS', 'Sequence', 'Seqs', 'sequence', 'seq', 'seqs'] : ['TARGET', 'Target', 'target'],
            c = ['length', 'Length', 'distance', 'Distance', 'snps', 'SNPs', 'tn93', 'TN93'];
          [a, b, c].forEach((list, i) => {
            $(these.get(i)).val("None");
            list.forEach(title => {
              if (headers.includes(title)) $(these.get(i)).val(title);
            });
            if ($(these.get(i)).val() == 'None' &&
              !(i == 1 && type == 'node') && //If Node Sequence...
              !(i == 2 && type == 'link')) { //...or Link distance...
                //...don't match to a variable in the dataset, leave them as "None".
              $(these.get(i)).val(headers[i]);
                //Everything else, just guess the next ordinal column.
            }
          });
        }
      }

      root.appendTo('#file-table');
      matchHeaders($(`[name="options-${file.name}"]:checked`).data('type'));

      function refit(e) {
        const type = $(e ? e.target : `[name="options-${file.name}"]:checked`).data('type'),
          these = $(`[data-file='${file.name}']`),
          first = $(these.get(0)),
          second = $(these.get(1)),
          third = $(these.get(2));
        if (type == 'node') {
          first.slideDown().find('label').text('ID');
          second.slideDown().find('label').text('Sequence');
          third.slideUp();
          matchHeaders(type);
        } else if (type == 'link') {
          first.slideDown().find('label').text('Source');
          second.slideDown().find('label').text('Target');
          third.slideDown();
          matchHeaders(type);
        } else {
          these.slideUp();
        }
        updateMetadata(file);
      }

      // $(`#file-${file.name}-field-1`).change(() => updateMetadata(file));
      // $(`#file-${file.name}-field-2`).change(() => updateMetadata(file));
      // $(`#file-${file.name}-field-3`).change(() => updateMetadata(file));
      document.getElementById(`file-${file.name}-field-1`).addEventListener('change', (event) => {
        updateMetadata(file);
        $('#launch').prop('disabled', false);
      });
      document.getElementById(`file-${file.name}-field-2`).addEventListener('change', (event) => {
        updateMetadata(file);
        $('#launch').prop('disabled', false);
      });
      document.getElementById(`file-${file.name}-field-3`).addEventListener('change', (event) => {
        updateMetadata(file);
        $('#launch').prop('disabled', false);
      });

      $(`[name="options-${file.name}"]`).change(() => {
        refit();
        $('#launch').prop('disabled', false);
      });

      refit();
    }
  }

  function updateMetadata(file){
    $('#file-panel .file-table-row').each((i, el) => {
      const $el = $(el);
      const fname = $el.data('filename');
      const selects = $el.find('select');
      const f = session.files.find(file => file.name == fname);
      f.format = $el.find('input[type="radio"]:checked').data('type');
      f.field1 = selects.get(0).value;
      f.field2 = selects.get(1).value;
      f.field3 = selects.get(2).value;
    });
  }

  async function readFastas() {
    const fastas = session.files.filter(f => f.extension.includes('fas'));
    const nodeCSVsWithSeqs = session.files.filter(f => f.format == "node" && f.field2 != "None" && f.field2 != "");
    if (fastas.length == 0 && nodeCSVsWithSeqs.length == 0) return [];
    let data = [];
    for(let i = 0; i < fastas.length; i++){
      let fasta = fastas[i];
      let nodes = await MT.parseFASTA(fasta.contents);
      data = data.concat(nodes);
    }
    // TODO: Cannot presently preview sequences in Node CSV/XLSX tables.
    // for(let j = 0; j < nodeCSVsWithSeqs.length; j++){
    //   let csv = nodeCSVsWithSeqs[j];
    //   await MT.parseNodeCSV(csv.contents).then(nodes => {
    //     data = data.concat(nodes);
    //   });
    // }
    return data;
  }

  async function updatePreview(data) {
    $('#alignment-preview').empty().append('<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>');
    if ($('#align-sw').is(':checked')) {
      data = await MT.align({
        nodes: data,
        reference: session.data.reference,
        match: [parseFloat($('#alignerMatch').val()), -parseFloat($('#alignerMismatch').val())],
        gap: [-parseFloat($('#alignerGapO').val()), -parseFloat($('#alignerGapE').val())]
      })
    }
    alignmentViewer(data, { showID: false })
      .then(canvas => $('#alignment-preview').empty().append(canvas));
  }

  $('.alignConfigRow').hide();

  $('#align-sw').parent().on('click', () => {
    session.style.widgets['align-sw'] = true;
    session.style.widgets['align-none'] = false;
    $('.alignConfigRow, #reference-file-row').slideDown();
    $('#alignment-preview').slideUp(function() {
      $(this).empty().show();
    });
  });

  $('#align-none').parent().on('click', () => {
    session.style.widgets['align-sw'] = false;
    session.style.widgets['align-none'] = true;
    $('.alignConfigRow, #reference-file-row').slideUp();
    $('#alignment-preview').slideUp(function () {
      $(this).empty().show();
    });
  });

  $('#reference-source-file').parent().on('click', () => {
    session.style.widgets['reference-source-file'] = true;
    session.style.widgets['reference-source-first'] = false;
    session.style.widgets['reference-source-consensus'] = false;
    session.data.reference = $('#refSeqID').val();
    if(!session.style.widgets['align-none']) $('#reference-file-row').slideDown();
  });

  $('#reference-source-first').parent().on('click', () => {
    session.style.widgets['reference-source-file'] = false;
    session.style.widgets['reference-source-first'] = true;
    session.style.widgets['reference-source-consensus'] = false;
    $('#reference-file-row').slideUp();
  });

  $('#reference-source-consensus').parent().on('click', () => {
    session.style.widgets['reference-source-file'] = false;
    session.style.widgets['reference-source-first'] = false;
    session.style.widgets['reference-source-consensus'] = true;
    $('#reference-file-row').slideUp();
  });

  $('#reference-file-row').hide();

  $('#refSeqFileLoad').on('change', function () {
    const file = this.files[0];
    let reader = new FileReader();
    reader.onloadend = e => {
      if (e.target.readyState == FileReader.DONE) {
        MT.parseFASTA(e.target.result).then(nodes => {
          $('#refSeqID')
            .html(nodes.map((d, i) => `
              <option value="${filterXSS(d.seq)}" ${i == 0 ? "selected" : ""}>${filterXSS(d.id)}</option>
            `))
            .trigger('change');
        });
        $('label[for="refSeqFileLoad"]').text(filterXSS(file.name));
      }
    };
    reader.readAsText(file);
  });

  $('#refSeqID').html(`
    <option value="${MT.HXB2.substr(2000, 2100)}" selected>Pol</option>
    <option value="${MT.HXB2}">Complete</option>
  `).on('change', function(){ session.data.reference = this.value; });

  $('#sequenceControlsButton, #alignment-preview').on('click', () => {
    readFastas().then(data => {
      if(session.style.widgets['reference-source-first']){
        session.data.reference = nodes[0].seq;
      }
      if(session.style.widgets['reference-source-consensus']){
        MT.computeConsensus().then(consensus => session.data.reference = consensus);
      }
      updatePreview(data);
    });
  });

  let auditBlock = $('#audited-sequences');
  const logAudit = (id, type) => {
    let match = auditBlock.find(`[data-id="${id}"]`);
    let button = $(`<button class="btn btn-warning btn-sm audit-exclude" data-id="${id}">Exclude</button>`).on('click', function(){
      let thi$ = $(this);
      const id = thi$.data('id');
      if(thi$.text() == 'Exclude'){
        session.data.nodeExclusions.push(id);
        thi$.removeClass('btn-warning').addClass('btn-success').text('Include');
      } else {
        session.data.nodeExclusions.splice(session.data.nodeExclusions.indexOf(id), 1);
        thi$.removeClass('btn-success').addClass('btn-warning').text('Exclude');
      }
    });
    let row = $(`<div class="alert alert-warning w-100 d-flex justify-content-between" role="alert"><span>${id} appears to be ${type}.</span></div>`);
    row.append(button);
    auditBlock.append(row);
  };

  $('#audit-launcher').on('click', () => {
    readFastas().then(data => {
      const start = Date.now();
      const isGaps = /^-+$/;
      const isRNA = /^[ACGURYMKWSBDHVN-]+$/;
      const isAA = /^[ARNDCQEGHILKMFPSTWYVBZN]+$/;
      const isDNA = /^[ACGTRYMKWSBDHVN-]+$/;
      const isCIGAR = /^[0-9MIDNSHP=X]+$/;
      const isMalformed = /[^ACGTURYMKWSBDHVNQEILFPZX0-9-]+/;
      const checkEmpty = $('#audit-empty').is(':checked');
      const checkGaps = $('#audit-gaps').is(':checked');
      const checkRNA = $('#audit-RNA').is(':checked');
      const checkAA = $('#audit-amino-acids').is(':checked');
      const checkCIGAR = $('#audit-CIGAR').is(':checked');
      const checkMalformed = $('#audit-malformed').is(':checked');
      let any = false;
      data.forEach(d => {
        const seq = d.seq, id = d.id;
        if(checkEmpty && seq == '') logAudit(id, 'empty');
        if(checkGaps && isGaps.test(seq)) logAudit(id, 'all gaps')
        if(checkRNA && isRNA.test(seq) && !isGaps.test(seq)) logAudit(id, 'RNA');
        if(checkAA && isAA.test(seq) && !isDNA.test(seq)) logAudit(id, 'amino acids');
        if(checkCIGAR && isCIGAR.test(seq)) logAudit(id, 'a CIGAR');
        if(checkMalformed && isMalformed.test(seq)) logAudit(id, 'malformed');
      });
      console.log('Sequence Auditing time:', (Date.now() - start).toLocaleString(), 'ms');
    });
  });

  $('#audit-toggle-all').on('click', () => {
    $('.audit-exclude').trigger('click');
  });

  /** ------ On Change ------ */

  // Files Tab

  // Distance Metric
  $('#default-distance-metric').change(function () {
    ga('send', 'event', 'default-distance-metric', 'update', this.value);
    const lsv = this.value;
    localforage.setItem('default-distance-metric', lsv);

    // TODO:: is this needed?
    //Update default distance to value
    $('#default-distance-metric').val(lsv);

    // Select SNPA
    if (lsv == 'snps') {
      // Hide ambiguities
      $('#ambiguities-row').slideUp();
      // Update Link threshold to 16
      $('#default-distance-threshold, #linkxz-threshold')
        .attr('step', 1)
        .val(16);
      // Update Link threshold in session
      session.style.widgets["link-threshold"] = 16;

    // Select TN93
    } else {
      // Show Ambiguities
      $('#ambiguities-row').slideDown();
      // Update Link thershold to 0.015
      $('#default-distance-threshold, #link-threshold')
        .attr('step', 0.001)
        .val(0.015);
      // Update value in session
      session.style.widgets["link-threshold"] = 0.015;
    }

    // Update distance metric to new distance metric (TN or SNS)
    session.style.widgets['default-distance-metric'] = lsv;
  });

  // Link distance threshold update into session since session will be looked at when instantiating views
  $('#default-distance-threshold').change(function () {
    session.style.widgets["link-threshold"] = this.value;
  });

  localforage.getItem('default-distance-metric').then(cachedLSV => {
    if (cachedLSV) {
      $('#default-distance-metric').val(cachedLSV).trigger('change');
    }
  });

  $('#ambiguity-resolution-strategy').on('change', function () {
    const v = this.value;
    session.style.widgets['ambiguity-resolution-strategy'] = v;
    if(v == 'HIVTRACE-G'){
      $('#ambiguity-threshold-row').slideDown();
    } else {
      $('#ambiguity-threshold-row').slideUp();
    }
  }).change();

  $('#ambiguity-threshold').on('change', function(){
    const v = this.value;
    session.style.widgets['ambiguity-threshold'] = v;
  });

  localforage.getItem('default-view').then(cachedView => {
    $('#default-view')
      .on('change', function () {
        const v = this.value;
        localforage.setItem('default-view', v);
        session.style.widgets['default-view'] = v;
        session.layout.content[0].type = v;
      })
      .val(cachedView ? cachedView : session.style.widgets['default-view'])
      .trigger('change');
  });

  $('#generate-sequences').on('click', () => {
    $('#file-prompt, #warning-prompt').remove();
    $('#launch').prop('disabled', false).focus();
    processFile(new File([Papa.unparse(MT.generateSeqs('gen-' + session.meta.readyTime + '-', parseFloat($('#generate-number').val()), 20))], 'generatedNodes.csv'));
  });

  $('#infer-directionality-false').parent().on('click', () => {
    session.style.widgets['infer-directionality-false'] = true;
  });

  $('#infer-directionality').parent().on('click', () => {
    session.style.widgets['infer-directionality-false'] = false;
  });

  $('#triangulate-false').parent().on('click', () => {
    session.style.widgets['triangulate-false'] = true;
  });

  $('#triangulate').parent().on('click', () => {
    session.style.widgets['triangulate-false'] = false;
  });

  $('#stash-auto-yes').parent().on('click', () => {
    localforage.setItem('stash-auto', 'true');
  });

  localforage.getItem('stash-auto').then(autostash => {
    if (autostash == 'true') {
      $('#stash-auto-yes').parent().trigger('click');
    }
  });

  $('#stash-auto-no').parent().on('click', () => {
    if (temp.autostash) clearInterval(temp.autostash.interval);
    localforage.setItem('stash-auto', 'false');
  });

  function message(msg) {
    session.messages.push(msg);
    $('#loading-information').html(session.messages.join('<br>'));
  }

  $('#launch').on('click', () => {
    session.meta.startTime = Date.now();
    $('#launch').prop('disabled', true);
    document.getElementById('loading-information').innerHTML="<p>Processing file(s)...</p>";
    new Promise(function(resolve, reject) {
      $('#loading-information-modal').on('shown.bs.modal', function (e) {
        session.messages = [];
        $('#loading-information').html('');
        resolve("done");
      });
      $('#loading-information-modal').modal({
        backdrop: false,
        keyboard: false
      });
      setTimeout(() => reject(new Error("Problem loading information modal!")), 5000);  
    }).then(
      result => launch(), // 
      error => {alert(error); launch(); } // informational modal doesn't load
    );
  })

  const launch = async () => {
    temp.messageTimeout = setTimeout(() => {
      $('#loadCancelButton').slideDown();
      alertify.warning('If you stare long enough, you can reverse the DNA Molecule\'s spin direction');
    }, 20000);

    const nFiles = session.files.length - 1;
    const check = nFiles > 0;

    const hierarchy = ['newick', 'matrix', 'link', 'node', 'fasta'];
    session.files.sort((a, b) => hierarchy.indexOf(a.format) - hierarchy.indexOf(b.format));

    session.meta.anySequences = session.files.some(file => (file.format == "fasta") || (file.format == "node" && file.field2 !== "None"));

    session.files.forEach((file, fileNum) => {
      const start = Date.now();
      const origin = [file.name];

      if (file.format == 'fasta') {

        message(`Parsing ${file.name} as FASTA...`);
        let newNodes = 0;
        MT.parseFASTA(file.contents).then(seqs => {
          const n = seqs.length;
          for (let i = 0; i < n; i++) {
            let node = seqs[i];
            if (!node) continue;
            newNodes += MT.addNode({
              _id: filterXSS(node.id),
              seq: filterXSS(node.seq),
              origin: origin
            }, check);
          }
          console.log('FASTA Merge time:', (Date.now() - start).toLocaleString(), 'ms');
          message(` - Parsed ${newNodes} New, ${seqs.length} Total Nodes from FASTA.`);
          if (fileNum == nFiles) processSequences();
        });

      } else if (file.format == 'link') {

        message(`Parsing ${file.name} as Link List...`);
        let l = 0;

        let forEachLink = link => {
          const keys = Object.keys(link);
          const n = keys.length;
          let safeLink = {};
          for (let i = 0; i < n; i++) {
            let key = filterXSS(keys[i]);
            safeLink[key] =  (typeof link[key] === 'string')  ?   filterXSS(link[key]) : link[key];  // #195
            if (!session.data.linkFields.includes(key)) {
              session.data.linkFields.push(key);
            }
          }
          l += MT.addLink(Object.assign({
            source: '' + safeLink[file.field1],
            target: '' + safeLink[file.field2],
            origin: origin,
            visible: true,
            distance: file.field3 == 'None' ? 0 : parseFloat(safeLink[file.field3])
          }, safeLink), check);
        };

        if (file.extension == 'xls' || file.extension == 'xlsx') {

          let workbook = XLSX.read(file.contents, { type: 'array' });
          let data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {raw: false, dateNF: 'yyyy-mm-dd'});
          data.map(forEachLink);
          message(` - Parsed ${l} New, ${data.length} Total Links from Link Excel Table.`);
          let n = 0, t = 0;
          let nodeIDs = [];
          const k = data.length;
          for (let i = 0; i < k; i++) {
            const l = data[i];
            const f1 = l[file.field1];
            if (nodeIDs.indexOf(f1) == -1) {
              t++;
              nodeIDs.push(f1);
              n += MT.addNode({
                _id: '' + f1,
                origin: origin
              }, true);
            }
            const f2 = l[file.field2];
            if (nodeIDs.indexOf(f2) == -1) {
              t++;
              nodeIDs.push(f2);
              n += MT.addNode({
                _id: '' + f2,
                origin: origin
              }, true);
            }
          }
          console.log('Link Excel Parse time:', (Date.now() - start).toLocaleString(), 'ms');
          message(` - Parsed ${n} New, ${t} Total Nodes from Link Excel Table.`);
          if (fileNum == nFiles) processSequences();

        } else {

          Papa.parse(file.contents, {
            delimiter: ",",
            // newline: "\r\n",
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: results => {
              let data = results.data;
              data.map(forEachLink);
              message(` - Parsed ${l} New, ${data.length} Total Links from Link CSV.`);
              results.meta.fields.forEach(key => {
                const safeKey = filterXSS(key);
                if (!session.data.linkFields.includes(safeKey)) {
                  session.data.linkFields.push(safeKey);
                }
              });
              let newNodes = 0, totalNodes = 0;
              const n = data.length;
              let nodeIDs = [];
              for (let i = 0; i < n; i++) {
                const l = data[i];
                const f1 = l[file.field1];
                if (nodeIDs.indexOf(f1) == -1) {
                  totalNodes++;
                  newNodes += MT.addNode({
                    _id: '' + f1,
                    origin: origin
                  }, true);
                }
                const f2 = l[file.field2];
                if (nodeIDs.indexOf(f2) == -1) {
                  totalNodes++;
                  newNodes += MT.addNode({
                    _id: '' + f2,
                    origin: origin
                  }, true);
                }
              }
              console.log('Link CSV Parse time:', (Date.now() - start).toLocaleString(), 'ms');
              message(` - Parsed ${newNodes} New, ${totalNodes} Total Nodes from Link CSV.`);
              if (fileNum == nFiles) processSequences();
            }
          });
        }
      } else if (file.format == 'node') {

        message(`Parsing ${file.name} as Node List...`);

        let m = 0, n = 0;

        if (file.extension == 'xls' || file.extension == 'xlsx') {

          let workbook = XLSX.read(file.contents, { type: 'array' });
          let data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {raw: false, dateNF: 'yyyy-mm-dd'});
          data.forEach(node => {
            let safeNode = {
              _id: filterXSS('' + node[file.field1]),
              seq: (file.field2 == 'None') ? '' : filterXSS(node[file.field2]),
              origin: origin
            };
            Object.keys(node).forEach(key => {
              let safeKey = filterXSS(key);
              if (!session.data.nodeFields.includes(safeKey)) {
                session.data.nodeFields.push(safeKey);
              }
              safeNode[safeKey] = filterXSS(node[key]);
            });
            m += MT.addNode(safeNode, check);
          });
          console.log('Node Excel Parse time:', (Date.now() - start).toLocaleString(), 'ms');
          message(` - Parsed ${m} New, ${n} Total Nodes from Node Excel Table.`);
          if (fileNum == nFiles) processSequences();

        } else {

          Papa.parse(file.contents, {
            delimiter: ",",
            // newline: "\r\n",
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            step: data => {
              let node = data.data;
              let safeNode = {
                _id: filterXSS('' + node[file.field1]),
                seq: (file.field2 == 'None') ? '' : filterXSS(node[file.field2]),
                origin: origin
              };
              Object.keys(node).forEach(key => {
                let safeKey = filterXSS(key);
                if (!session.data.nodeFields.includes(safeKey)) {
                  session.data.nodeFields.push(safeKey);
                }
                // safeNode[safeKey] = filterXSS(node[key]);
                safeNode[safeKey] =  (typeof node[key] === 'string')  ?   filterXSS(node[key]) : node[key]; //#173

              });
              m += MT.addNode(safeNode, check);
            },
            complete: () => {
              console.log('Node CSV Parse time:', (Date.now() - start).toLocaleString(), 'ms');
              message(` - Parsed ${m} New, ${n} Total Nodes from Node CSV.`);
              if (fileNum == nFiles) processSequences();
            }
          });
        }

      } else if (file.format == 'matrix') {

        message(`Parsing ${file.name} as Distance Matrix...`);

        if (file.extension == 'xls' || file.extension == 'xlsx') {

          let workbook = XLSX.read(file.contents, { type: 'array' });
          let data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1, raw: false, dateNF: 'yyyy-mm-dd'});
          let nodeIDs = [], nn = 0, nl = 0;

          if (data[0][0].replace(/\"/g, '').replace(/\'/g, '')) { // triangle matrix
            let topNodeIDs = [''];
            data.forEach((row, i) => {
              const nodeID = row[0];
              topNodeIDs.push(nodeID);
            })
            data.unshift(topNodeIDs);
          }

          data.forEach((row, i) => {
            if (i == 0) {
              nodeIDs = row;
              nodeIDs.forEach((cell, k) => {
                if (k > 0) {
                  nn += MT.addNode({
                    _id: filterXSS('' + cell),
                    origin: origin
                  }, check);
                }
              });
            } else {
              const source = filterXSS('' + row[0]);
              row.forEach((cell, j) => {
                if (j == 0) return;
                const target = filterXSS('' + nodeIDs[j]);
                if (source == target) return;
                nl += MT.addLink({
                  source: source,
                  target: target,
                  origin: origin,
                  distance: parseFloat(cell)
                }, check);
              });
            }
          });
          console.log('Distance Matrix Excel Parse time:', (Date.now() - start).toLocaleString(), 'ms');
          message(` - Parsed ${nn} New, ${data.length - 1} Total Nodes from Excel Distance Matrix.`);
          message(` - Parsed ${nl} New, ${((data.length - 1) ** 2 - (data.length - 1)) / 2} Total Links from Excel Distance Matrix.`);
          if (fileNum == nFiles) processSequences();

        } else {

          MT.parseCSVMatrix(file).then(o => {
            message(` - Parsed ${o.nn} New, ${o.tn} Total Nodes from Distance Matrix.`);
            message(` - Parsed ${o.nl} New, ${o.tl} Total Links from Distance Matrix.`);
            if (fileNum == nFiles) processSequences();
          });
        }

      } else { // if(file.format == 'newick'){

        let links = 0;
        let newLinks = 0;
        let newNodes = 0;
        const tree = patristic.parseNewick(file.contents);
        temp.tree = tree;
        let m = tree.toMatrix(), matrix = m.matrix, labels = m.ids.map(filterXSS), n = labels.length;
        for (let i = 0; i < n; i++) {
          const source = labels[i];
          newNodes += MT.addNode({
            _id: source,
            origin: origin
          }, check);
          for (let j = 0; j < i; j++) {
            newLinks += MT.addLink({
              source: source,
              target: labels[j],
              origin: origin,
              distance: parseFloat(matrix[i][j])
            }, check);
            links++;
          }
        }
        console.log('actual tree: ', tree);
        console.log('Newick Tree Parse time:', (Date.now() - start).toLocaleString(), 'ms');
        message(` - Parsed ${newNodes} New, ${n} Total Nodes from Newick Tree.`);
        message(` - Parsed ${newLinks} New, ${links} Total Links from Newick Tree.`);
        if (fileNum == nFiles) processSequences();
      }
    });

    async function processSequences() {
      if (!session.meta.anySequences) return MT.runHamsters();
      session.data.nodeFields.push('seq');
      let nodes = session.data.nodes, subset = [];
      const n = nodes.length;
      const gapString = '-'.repeat(session.data.reference.length);
      for (let i = 0; i < n; i++) {
        const d = nodes[i];
        if (!d.seq) {
          d.seq = gapString;
        } else {
          subset.push(d);
        }
      }
      if (session.style.widgets['align-sw']){
        message('Aligning Sequences...');
        let output = await MT.align({
          reference: session.data.reference,
          isLocal: $('#localAlign').is(':checked'),
          match: [$('#alignerMatch').val(), $('#alignerMismatch').val()].map(parseFloat),
          gap: [$('#alignerGapO').val(), $('#alignerGapE').val()].map(parseFloat),
          nodes: subset
        });
        const start = Date.now();
        const m = subset.length;
        for (let j = 0; j < m; j++) {
          Object.assign(subset[j], output[j]);
        }
        console.log("Alignment Merge time: ", (Date.now() - start).toLocaleString(), "ms");
      }
      const start = Date.now();
      for(let k = 0; k < n; k++){
        let node = nodes[k];
        node['_seqInt'] = tn93.toInts(node['seq']);
      }
      console.log("Integer Sequence Translation time: ", (Date.now() - start).toLocaleString(), "ms");
      session.data.consensus = await MT.computeConsensus();
      await MT.computeConsensusDistances();
      subset.sort((a, b) => a['_diff'] - b['_diff']);
      if(session.style.widgets['ambiguity-resolution-strategy']){
        await MT.computeAmbiguityCounts();
      }
      message('Computing Links based on Genomic Proximity...');
      const k = await MT.computeLinks(subset);
      message(` - Found ${k} New Links from Genomic Proximity`);
      MT.runHamsters();
    };
  };
})();