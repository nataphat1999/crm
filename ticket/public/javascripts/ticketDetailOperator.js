$(document).ready(async function () {
  var devDB = [];
  var managerTicket = "";
  let ticket_level_id = 0;
  let ticket_status_id = 0;
  checkDueDate();
  getTicketDetail();
  getTicketType();
  getCategory();
  clearSign();
  addTicketApprove();
  addTicketConfirm();
  updateTicketConfirm();
  addTicketApproveConfirm();
  addTicketChangedevConfirm();
  addTicketComplete();
  addTicketApprove2();
  addTicketSuccess();
  reviseTicket();
  rejectTicket();
  changeSign();
  changeAttachFile();
  changeTicketCode();
  $(".loader").hide();
  addRowTask();
});

function diableInput() {
  const userTypeId = parseInt(document.getElementById("user_type").value);

  if (userTypeId === 1) {
    const elements = document.querySelectorAll(
      "#form_activity input, #form_activity button, #form_activity_detail input, #form_activity_detail button, #selected_approve input, #selected_approve2 input, #textarea_note_reject textarea, #textarea_note_disapprove textarea, #form_disapprove_description textarea, #selected_approve_star_manager button, #selected_approve_star_user button, #btn_edit_dev, #btn_approve_ticket, #btn_confirm_ticket, #btn_update_ticket, #btn_approve_confirm, #btn_changedev_confirm, #btn_complete_ticket, #btn_approve_ticket2, #btn_success, #btn_revise_ticket, #btn_rating_user, #btn_reject_user, #btn_cancel_add_ticket"
    );

    elements.forEach((element) => {
      element.disabled = true;
    });

    const buttons = document.querySelectorAll(
      "#btn_edit_dev, #btn_approve_ticket, #btn_confirm_ticket, #btn_update_ticket, #btn_approve_confirm, #btn_changedev_confirm, #btn_complete_ticket, #btn_approve_ticket2, #btn_success, #btn_revise_ticket, #btn_rating_user, #btn_reject_user, #btn_cancel_add_ticket"
    );
    buttons.forEach((button) => {
      button.style.display = "none";
    });
  }
}

function addRowTask() {
  $(document).on(
    "change",
    'input[type="checkbox"][name="checkbox[]"]',
    function () {
      calculateProgress();
    }
  );

  $("#button_add_task").click(function (event) {
    const container = document.getElementById("input-container");
    const newInput = document.createElement("div");
    const index = container.children.length + 1;
    newInput.classList.add("input-group", "mb-1");
    newInput.innerHTML = `
            <span class="input-group-text input-index">${index}</span>
            <input type="text" class="form-control" name="input[]" placeholder="">
            <button type="button" class="btn btn-danger btn-sm" id="button_delete_task" onclick="removeRowTaskActivity(this,'insert')"><img class='card-icon' src='../public/images/icon/bin.png' /></button>
        `;
    container.appendChild(newInput);
  });

  $("#button_add_task_detail").click(function (event) {
    const container = document.getElementById("input-container-detail");
    const newInput = document.createElement("div");
    const index = container.children.length + 1;
    newInput.classList.add("input-group", "mb-1");
    newInput.innerHTML = `
            <input class="me-2" type="checkbox" name="checkbox[]" id="checkbox-detail-${index}" value="${index}">
            <span class="input-group-text input-index">${index}</span>
            <input type="text" class="form-control" name="input-detail[]" placeholder="" id="input-detail-${index}">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRowTaskActivity(this,'detail')"><img class='card-icon' src='../public/images/icon/bin.png' /></button>
        `;
    container.appendChild(newInput);
    calculateProgress();
  });
}

function removeRowTaskActivity(data, type) {
  data.parentElement.remove();
  updateIndexes(type);
}

function updateIndexes(type) {
  if (type == "detail") {
    const rows = document.querySelectorAll(
      "#input-container-detail .input-group"
    );
    rows.forEach((row, index) => {
      row.querySelector(".input-index").textContent = `${index + 1}`;
    });
    calculateProgress();
  } else {
    const rows = document.querySelectorAll("#input-container .input-group");
    rows.forEach((row, index) => {
      row.querySelector(".input-index").textContent = `${index + 1}`;
    });
  }
}

async function getProjectCode() {
  $("#ticket_project_name").select2({
    placeholder: "Please select project code",
    allowClear: true,
  });
  try {
    const response = await axios.get("/api/getProjectCRM", {});
    setProjectCode(response.data.Result);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: err,
    });
  }
}

function setProjectCode(data) {
  var ticket_project_name = document.getElementById("ticket_project_name");
  for (let i = 0; i < data.length; i++) {
    var code = data[i].code;
    var name = data[i].name;
    var opt = document.createElement("option");
    opt.value = code + " | " + name;
    opt.innerHTML = "[" + data[i].code + "] " + data[i].name;
    ticket_project_name.appendChild(opt);
  }
}

function changeTicketCode() {
  $("#ticket_project_name_other_checkbox").on("change", function () {
    var is_checked = $(this).is(":checked");
    if (is_checked) {
      $("#ticket_project_name").prop("disabled", true);
      $("#ticket_project_name_other_form").show();
    } else {
      $("#ticket_project_name").prop("disabled", false);
      $("#ticket_project_name_other_form").hide();
    }
  });
}

async function getProgrammer(department_id) {
  $("#ticket_programmer_selected").select2({
    placeholder: "Please select operator",
    allowClear: true,
  });
  try {
    const response = await axios.post("/api/getProgramer", {
      department_id: department_id,
    });
    setDevSelection(response.data.Result);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: err,
    });
  }
}

function setDevSelection(data) {
  console.log("programer");
  console.log(data);

  var ticket_programmer_selected = document.getElementById(
    "ticket_programmer_selected"
  );
  for (let i = 0; i < data.length; i++) {
    //console.log(data)
    var user_id = data[i].user_id;
    var user_name = data[i].user_firstname + " " + data[i].user_lastname;
    var opt = document.createElement("option");
    opt.value = user_id;
    opt.innerHTML = user_name;
    ticket_programmer_selected.appendChild(opt);
  }
}

function getDepartment(department_id) {
  $("#ticket_department_selected").select2({
    placeholder: "Please select department",
    allowClear: true,
  });

  axios
    .get("/api/getDepartment", {})

    .then((response) => setDeptSelection(response.data.Result, department_id))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function setDeptSelection(data, department) {
  // console.log(data)

  var ticket_department_selected = document.getElementById(
    "ticket_department_selected"
  );
  for (let i = 0; i < data.length; i++) {
    //console.log(data)
    var department_id = data[i].department_id;
    var department_name = data[i].department_name;
    var opt = document.createElement("option");
    opt.value = department_id;
    opt.innerHTML = department_name;
    ticket_department_selected.appendChild(opt);
  }

  $("#ticket_department_selected").val(department).change();
}

function getTicketType() {
  $("#ticket_type_selected").select2({
    placeholder: "Please select type",
    allowClear: true,
  });

  axios
    .post("/api/getTicketType", {})

    .then((response) => setTypeSelection(response.data.Result))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function setTypeSelection(data) {
  const ticket_type_selected = document.getElementById("ticket_type_selected");
  const fragment = document.createDocumentFragment();

  data.forEach(({ ticket_type_id, ticket_type_name }) => {
    const opt = document.createElement("option");
    opt.value = ticket_type_id;
    opt.textContent = ticket_type_name;
    fragment.appendChild(opt);
  });

  ticket_type_selected.appendChild(fragment);
}

function getCategory() {
  $("#ticket_category_selected").select2({
    placeholder: "Please select category",
    allowClear: true,
  });

  axios
    .get("/api/getCategory", {})

    .then((response) => setCategorySelection(response.data.Result))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function setCategorySelection(data) {
  // console.log(data)

  var ticket_category_selected = document.getElementById(
    "ticket_category_selected"
  );
  for (let i = 0; i < data.length; i++) {
    //console.log(data)
    var category_id = data[i].category_id;
    var category_name = data[i].category_name;
    var opt = document.createElement("option");
    opt.value = category_id;
    opt.innerHTML = category_name;
    ticket_category_selected.appendChild(opt);
  }

  // $('#ticket_type_selected').val().change();
}

async function getTaskActivityByTicket(ticket_id, status_id) {
  try {
    const response = await axios.post("/api/getTaskActivityByTicket", {
      ticket_id,
    });
    setTaskActivity(response.data.Result, status_id);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: err,
    });
  }
}

function setTaskActivity(data, status_id) {
  const container = document.getElementById("input-container-detail");
  const fragment = document.createDocumentFragment();
  data.forEach(
    (
      { task_activity_id, task_activity_description, task_activity_complete },
      index
    ) => {
      const div = document.createElement("div");
      div.classList.add("input-group", "mb-1");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "checkbox[]";
      checkbox.value = index + 1;
      checkbox.id = "checkbox-detail-" + index;
      checkbox.checked = task_activity_complete;
      checkbox.classList.add("me-2");

      const span = document.createElement("span");
      span.classList.add("input-group-text", "input-index");
      span.textContent = index + 1;

      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("form-control");
      input.name = "input-detail[]";
      input.id = "input-detail-" + index;
      input.value = task_activity_description;
      input.setAttribute("data-id", task_activity_id);

      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("btn", "btn-danger", "btn-sm");
      button.innerHTML = `<img class='card-icon' src='../public/images/icon/bin.png' />`;
      button.onclick = function () {
        removeRowTaskActivity(button, "detail");
      };

      if (task_activity_complete == 1 || status_id == 5) {
        input.disabled = true;
        button.disabled = true;
        checkbox.disabled = true;
      }

      div.appendChild(checkbox);
      div.appendChild(span);
      div.appendChild(input);
      div.appendChild(button);

      fragment.appendChild(div);
    }
  );

  container.appendChild(fragment);
}

function calculateProgress() {
  const inputs = document.querySelectorAll('input[name="input-detail[]"]');
  const task_activitys = Array.from(inputs).map((input) => input);

  const checkboxes = document.querySelectorAll('input[name="checkbox[]"]');
  const inputChecked = Array.from(checkboxes).map(
    (checkbox) => checkbox.checked
  );

  let totalSuccess = 0;
  let totalProgress = inputChecked.length;
  let colorProgress = "black";

  task_activitys
    .filter((e, idx) => inputChecked[idx])
    .forEach((e) => (totalSuccess += 1));
  let progress = (totalSuccess / totalProgress) * 100;
  var user_type = $("#user_type").val();

  $("#selected_approve_star_manager").hide();

  if (parseInt(progress) == 100) {
    colorProgress = "green";
    if (user_type == 3 || user_type == 4) {
      for (let i = 0; i < devDB.length; i++) {
        console.log("Test1");
        if (managerTicket == devDB[i]) {
          console.log("Test2");
          if (
            ticket_level_id == 2 ||
            (user_type == 3 && ticket_level_id == 1)
          ) {
            $("#selected_approve_star_manager").show();
            break;
          } else {
            $("#selected_approve_star_manager").hide();
          }
        }
      }

      if (ticket_status_id == 11) {
        $("#selected_approve_star_manager").hide();
      }
    }
  } else if (parseInt(progress) > 0) {
    colorProgress = "orange";
  }
  if (isNaN(progress)) progress = 0;

  $("#label_task_activity").html(
    "Task Activity <span style='font-size: 18px;color: " +
      colorProgress +
      "'>(" +
      progress.toFixed(2) +
      "%)</span>"
  );
  return parseInt(progress);
}

function getSeverity(ticket) {
  $("#severity_detail").select2({
    placeholder: "Please select severity",
    allowClear: true,
  });
  axios
    .get("/api/getSeverity", {})

    .then((response) => setSeverity(response.data.Result, ticket))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function checkDueDate() {
  $("#severity_detail").on("change", function () {
    setDueDate();
  });
  $("#ticket_start_date").on("change", function () {
    setDueDate();
  });
}

function setDueDate() {
  var startDate = $("#ticket_start_date").val();
  if (startDate != "") {
    var date = new Date(startDate);
    var severity = $("#severity_detail").val();
    var severityDay = 0;
    var dateString = "";

    if (severity == "3") {
      severityDay += 1;
    } else if (severity == "4") {
      severityDay += 3;
    }
    date.setDate(date.getDate() + severityDay);
    if (severity == "5") {
      $("#ticket_due_date_manager").prop("disabled", false);
    } else {
      dateString = date.toISOString().split("T")[0];
      $("#ticket_due_date_manager").prop("disabled", true);
    }
    $("#ticket_due_date_manager").val(dateString);
  }
}

function setSeverity(data, ticket) {
  var severity_detail = document.getElementById("severity_detail");
  for (let i = 0; i < data.length; i++) {
    var id = data[i].severity_id;
    var name = data[i].severity_name;
    var desc = data[i].severity_description;
    var opt = document.createElement("option");
    opt.value = id;
    opt.innerHTML = name + " " + desc;
    severity_detail.appendChild(opt);

    if (ticket.status_id > 1) {
      $("#severity_detail").val(ticket.severity_id);
      $("#severity_detail").prop("disabled", true);
    }
  }
}

async function getTicketDetail() {
  await getProjectCode();
  var ticket_id = getUrlParameter("ticket_id");
  $(".loader").show();
  axios
    .post("/api/getTicketDetail", { ticket_id: ticket_id })

    .then((response) => setTicketDetail(response.data.Result[0]))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

var attachFile = [];
var attachUpdateFile = [];
var attachOldFile = [];
var attachFileType = "";

function changeAttachFile() {
  $("#ticket_attachment_dev").on("change", function (event) {
    $("#files_selected_dev").empty();
    var files = $("#ticket_attachment_dev").get(0).files;
    var data = Array.from(files);

    for (const nfile of data) {
      const Files = attachFile.filter(item => typeof item === "string")
      const Files2 = attachFile.filter(item => typeof item === "object")

      const idx = Files.findIndex(name => name === nfile.name)
      const idx2 = Files2.findIndex(f => f.name === nfile.name)
      
      if (idx == -1 && idx2 == -1) {
        attachFile.push(nfile);
      }
  }

    // attachFile.push(...data)
    // attachFile = attachFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

    for (let i = 0; i < attachFile.length; i++) {
      if (i == 0) {
        $("#files_selected_dev").append('<ul class="ul_files">');
      }

      var list_files =
        '<li class="li_files_dev' +
        i +
        '" data-index="' +
        i +
        '"><div">' +
        attachFile[i].name +
        '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
      $("#files_selected_dev").append(list_files);

      if (i == attachFile.length - 1) {
        $("#files_selected_dev").append("</ul>");
      }
    }
    event.target.value = null;
  });
  $("#ticket_attachment_dev_update").on("change", function (event) {
    $("#files_selected_dev_update").empty();
    var files = $("#ticket_attachment_dev_update").get(0).files;
    var data = Array.from(files);
 
    for (const nfile of data) {
      const Files = attachUpdateFile.filter(item => typeof item === "string")
      const Files2 = attachUpdateFile.filter(item => typeof item === "object")

      const idx = Files.findIndex(name => name === nfile.name)
      const idx2 = Files2.findIndex(f => f.name === nfile.name)
      
      if (idx == -1 && idx2 == -1) {
        attachUpdateFile.push(nfile);
      }
    }

    // attachUpdateFile = attachUpdateFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));
    for (let i = 0; i < attachUpdateFile.length; i++) {
      if (i == 0) {
        $("#files_selected_dev_update").append('<ul class="ul_update_files">');
      }

      var list_files = "";
      if (typeof attachUpdateFile[i] === "string") {
        const newFile =
          '<div style="float: right; cursor: pointer;">&nbsp;&nbsp;</div><a href="' +
          attachUpdateFile[i] +
          '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a>';
        list_files =
          '<li class="li_files_update_dev' +
          i +
          '"data-index="' +
          i +
          '"><div">' +
          attachUpdateFile[i] +
          '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" />' +
          newFile +
          "</div></li>";
      } else {
        list_files =
          '<li class="li_files_update_dev' +
          i +
          '"data-index="' +
          i +
          '"><div">' +
          attachUpdateFile[i].name +
          '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
      }

      $("#files_selected_dev_update").append(list_files);

      if (i == files.length - 1) {
        $("#files_selected_dev_update").append("</ul>");
      }
    }
    event.target.value = null;
  });
}

function deletefile(element) {
  const index = $(element).closest("li").data("index");
  const classList = $(element).closest("li").attr("class");
  $(element).closest("li").remove();
  if (classList.startsWith("li_files_update_dev")) {
    attachUpdateFile.splice(index, 1);
    $('[class^="li_files_update_dev"]').each(function (i) {
      $(this).attr("data-index", i);
    });
  } else if (classList.startsWith("li_files_dev")) {
      attachFile.splice(index, 1);
      $('[class^="li_files_dev"]').each(function (i) {
        $(this).attr("data-index", i);
      });
  }
}

function getLevel(ticket) {
  $("#level_detail").select2({
    placeholder: "Please select level",
    allowClear: true,
  });

  axios
    .get("/api/getLevel", {})

    .then((response) => setLevelSelection(response.data.Result, ticket))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function setLevelSelection(data, ticket) {
  var level_detail = document.getElementById("level_detail");
  for (let i = 0; i < data.length; i++) {
    var id = data[i].ticket_level_id;
    var name = data[i].ticket_level_name;
    var opt = document.createElement("option");
    opt.value = id;
    opt.innerHTML = name;
    level_detail.appendChild(opt);

    if (ticket.status_id > 1) {
      $("#level_detail").val(ticket.ticket_level_id);
      $("#level_detail").prop("disabled", true);
    }
  }
}

async function setTicketDetail(data) {
  getSeverity(data);
  getLevel(data);
  $("#ticket_no").val(data.ticket_no);
  $("#ticket_name").val(data.ticket_name);
  var user_type = $("#user_type").val();
  let department_id = data.department_id;
  managerTicket = data.ticket_manager;
  ticket_level_id = data.ticket_level_id;
  ticket_status_id = data.status_id;

  await getProgrammer(department_id);
  await getDepartment(department_id);
  await getTaskActivityByTicket(data.ticket_id, data.status_id);

  $("#selected_approve_star_manager").hide();
  $("#selected_approve_star_user").hide();
  $("#textarea_note_disapprove").hide();
  $("#textarea_note_reject").hide();
  $("#file_user").hide();
  $("#file_dev").hide();
  $("#add_file_dev").hide();
  $("#update_file_dev").hide();
  $("#show_file_dev").hide();
  $("#btn_reject_user").hide();
  $("#form_file_user_reject").hide();
  $("#form_reject_description").hide();
  $("#form_activity").hide();
  $("#form_activity_detail").hide();
  $("#form_disapprove_description").hide();
  $("#form_file_user_reject_to_approver").hide();
  $("#files_manager_disapprove").hide();

  $("#custom_duedate").hide();
  $("#note_duedate").hide();
  $("#form_file_note_duedate").hide();

  $("#note_user_reject").hide();
  $("#file_user_reject").hide();

  if (data.status_id == 8) {
    $("#ticket_note_cancel").val(data.ticket_cancel_remark_user);
  } else {
    $("#textarea_note_cancel").hide();
  }

  if (data.ticket_remark_approver_change_due_date) {
    $("#custom_duedate").show();
    $("#note_duedate").show();
    $(".btn_file_duedate").hide();
    $("#custom_due_date").prop("checked", true);
    $("#custom_due_date").prop("disabled", true);
    $("#duedate_remark").val(data.ticket_remark_approver_change_due_date);
    $("#duedate_remark").prop("disabled", true);

    var attachDDFileName = [];
    var attachDDFile = data.ticket_attachment_approver_change_due_date;
    if (attachDDFile) {
      $("#form_file_note_duedate").show();
      attachDDFile = attachDDFile.split("|");
      for (let i = 0; i < attachDDFile.length; i++) {
        attachDDFileName[i] = attachDDFile[i].split("attachment/");
        if (i == 0) {
          $("#files_change_duedate").append('<ul class="ul_files">');
        }

        var listDDfiles =
          '<li class="li_files' +
          i +
          '"><div">' +
          attachDDFileName[i][1] +
          '<a href="' +
          attachDDFile[i] +
          '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
        $("#files_change_duedate").append(listDDfiles);

        if (i == attachDDFile.length - 1) {
          $("#files_change_duedate").append("</ul>");
        }
      }
    }
  }

  if (data.ticket_attachment_user) {
    $("#file_user").show();
    if (data.ticket_attachment_user) {
      var attachFile_user = data.ticket_attachment_user.split("|");
      var attachFileName_user = [];

      for (let i = 0; i < attachFile_user.length; i++) {
        attachFileName_user[i] = attachFile_user[i].split("attachment/");
        if (i == 0) {
          $("#files_selected").append('<ul class="ul_files">');
        }

        var list_files =
          '<li class="li_files' +
          i +
          '"><div">' +
          attachFileName_user[i][1] +
          '<a href="' +
          attachFile_user[i] +
          '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
        $("#files_selected").append(list_files);

        if (i == attachFile_user.length - 1) {
          $("#files_selected").append("</ul>");
        }
      }
    }
  }

  if (data.ticket_attachment_dev) {
    if (data.status_id > 3 && data.status_id != 5) {
      if (data.ticket_attachment_dev) {
        $("#show_file_dev").show();
        var attachFile_dev = data.ticket_attachment_dev.split("|");
        var attachFileName_dev = [];

        for (let i = 0; i < attachFile_dev.length; i++) {
          attachFileName_dev[i] = attachFile_dev[i].split("attachment/");
          if (i == 0) {
            $("#show_files_selected_dev").append('<ul class="ul_files">');
          }

          var list_files_dev =
            '<li class="li_show_files_dev' +
            i +
            '"><div">' +
            attachFileName_dev[i][1] +
            '<a href="' +
            attachFile_dev[i] +
            '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
          $("#show_files_selected_dev").append(list_files_dev);

          if (i == attachFile_dev.length - 1) {
            $("#show_files_selected_dev").append("</ul>");
          }
        }
      }
    } else if (data.status_id === 3 || data.status_id === 5) {
      if (data.ticket_attachment_dev) {
        $("#update_file_dev").show();
        var attachFile_dev = data.ticket_attachment_dev.split("|");
        var attachFileName_dev = [];
        for (let i = 0; i < attachFile_dev.length; i++) {
          attachFileName_dev[i] = attachFile_dev[i].split("attachment/");
          attachOldFile.push(attachFileName_dev[i][1]);
          attachUpdateFile.push(attachFileName_dev[i][1]);
          if (i == 0) {
            $("#files_selected_dev_update").append('<ul class="ul_files">');
          }

          let deleteIcon = "";
          if (data.status_id != 5) {
            deleteIcon =
              '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" />';
          }
          var list_files =
            '<li class="li_files_update_dev' +
            i +
            '" data-index="' +
            i +
            '"><div">' +
            attachFileName_dev[i][1] +
            "" +
            deleteIcon +
            '<div style="float: right; cursor: pointer;">&nbsp;&nbsp;</div><a href="' +
            attachFile_dev[i] +
            '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
          $("#files_selected_dev_update").append(list_files);

          if (i == attachFile_dev.length - 1) {
            $("#files_selected_dev_update").append("</ul>");
          }
        }
      }
    }
  }

  if (data.ticket_note) {
    $("#form_disapprove_description").show();
    $("#disapprove_description").val(data.ticket_note);
    if (data.ticket_attachment_disapprove_operator) {
      $("#files_manager_disapprove").show();
      var attachFileDisapprover =
        data.ticket_attachment_disapprove_operator.split("|");
      var attachFileNameDisapprover = [];
      for (let i = 0; i < attachFileDisapprover.length; i++) {
        attachFileNameDisapprover[i] =
          attachFileDisapprover[i].split("attachment/");
        if (i == 0) {
          $("#files_selected_disapprove").append('<ul class="ul_files">');
        }

        var list_files =
          '<li class="li_file_approver_disapprover' +
          i +
          '" data-index="' +
          i +
          '"><div">' +
          attachFileNameDisapprover[i][1] +
          '<a href="' +
          attachFileDisapprover[i] +
          '" download><img class="card-icon" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
        $("#files_selected_disapprove").append(list_files);

        if (i == attachFileDisapprover.length - 1) {
          $("#files_selected_disapprove").append("</ul>");
        }
      }
    }
  }

  var ticket_date = moment(data.ticket_datetime).format("YYYY-MM-DD HH:mm:ss");
  $("#ticket_date").val(ticket_date);
  $("#ticket_date_col_6").val(ticket_date);

  if (data.ticket_start_date) {
    var ticket_start_date = moment(data.ticket_start_date).format("YYYY-MM-DD");
    $("#ticket_start_date").val(ticket_start_date);
  }

  if (data.ticket_end_date) {
    var ticket_end_date = moment(data.ticket_end_date).format("YYYY-MM-DD");
    $("#ticket_end_date").val(ticket_end_date);
  }

  var ticket_due_date_user = moment(data.ticket_due_date_user).format(
    "YYYY-MM-DD"
  );
  $("#ticket_due_date_user").val(ticket_due_date_user);
  $("#ticket_due_date_user_col_6").val(ticket_due_date_user);

  if (data.ticket_due_date_manager) {
    var ticket_due_date_manager = moment(data.ticket_due_date_manager).format(
      "YYYY-MM-DD"
    );
    $("#ticket_due_date_manager").val(ticket_due_date_manager);
  }

  if (data.status_id != 6 && data.status_id != 10 && data.status_id != 11) {
    setRating();
  }

  $("#ticket_objective").val(data.ticket_objective);
  $("#ticket_description").val(data.ticket_description);
  $("#ticket_type_selected").val(data.ticket_type_id).change();
  $("#ticket_category_selected").val(data.category_id).change();

  if (data.user_firstname && data.user_lastname) {
    var user_name = data.user_firstname + " " + data.user_lastname;
    $("#user_name").html(user_name);
  }

  if (data.manager_firstname && data.manager_lastname) {
    var manager_name = data.manager_firstname + " " + data.manager_lastname;
    $("#manager_name").html(manager_name);
  }

  if (data.dev_firstname && data.dev_lastname) {
    var programmer_name = data.dev_firstname + " " + data.dev_lastname;
    $("#programmer_name").html(programmer_name);
  }

  const ticket_project_name = data.ticket_project_code;
  const option = $("#ticket_project_name option").filter(function () {
    return $(this).val() == ticket_project_name;
  });
  if (option.length == 1) {
    $("#ticket_project_name").val(ticket_project_name);
    $("#ticket_project_name_other_form").hide();
    $("#ticket_project_name option")
      .filter(function () {
        return $(this).val() == ticket_project_name;
      })
      .prop("selected", true);
    $("#ticket_project_name").trigger("change");

    if (data.status_id != 9) {
      $("#form_ticket_project_name_other_checkbox").hide();
      $("#ticket_project_name").prop("disabled", true);
    }
  } else {
    $("#ticket_project_name_other").val(ticket_project_name);
    if (data.status_id != 9) {
      $("#ticket_project_name_other").prop("disabled", true);
      $("#ticket_project_name").prop("disabled", true);
      $("#ticket_project_name_other_checkbox").prop("checked", true);
      $("#ticket_project_name_other_checkbox").prop("disabled", true);
    } else {
      $("#ticket_project_name_other_checkbox").prop("checked", true);
      $("#ticket_project_name").prop("disabled", true);
    }
  }

  $("#btn_revise_ticket").hide();
  let ticket_dev = [];
  if (data.status_id != 1 && data.status_id != 7 && data.status_id != 9) {
    const programmer_data = data.ticket_programmer.split(",");

    for (let i = 0; i < programmer_data.length; i++) {
      ticket_dev.push(programmer_data[i]);
    }

    devDB = ticket_dev;
  }

  changeDev();
  $("#btn_approve_confirm").hide();
  $("#btn_approve_ticket").hide();
  $("#btn_approve_ticket2").hide();
  $("#btn_confirm_ticket").hide();
  $("#btn_update_ticket").hide();
  $("#btn_complete_ticket").hide();
  $("#btn_changedev_confirm").hide();
  $("#btn_edit_dev").hide();
  $("#btn_success").hide();
  $("#manager_signature").hide();
  $("#clearSignManager").hide();
  $("#selected_approve").hide();
  $("#selected_approve2").hide();
  $("#programmer_signature").hide();
  $("#clearSignProgrammer").hide();
  $("#file_programmer_signature").hide();
  $("#file_manager_signature").hide();

  $("#ticket_type_selected").prop("disabled", true);
  $("#ticket_category_selected").prop("disabled", true);
  if (data.ticket_signature_dev) {
    $("#ticket_sign_programmer").attr("src", data.ticket_signature_dev);
  } else {
    $("#ticket_sign_programmer").attr(
      "src",
      "../public/images/sign/sign_null.png"
    );
  }
  if (data.ticket_signature_manager) {
    $("#ticket_sign_manager").attr("src", data.ticket_signature_manager);
  } else {
    $("#ticket_sign_manager").attr(
      "src",
      "../public/images/sign/sign_null.png"
    );
  }

  if (data.status_id == 1) {
    $("#form_due_date").hide();
    $("#form_type_category").hide();
    $("#form_start_end_date").hide();
    $("#form_severity_detail").hide();
    $("#label_programmer_name").hide();
    $("#form_estimate_due_date").hide();
    $("#form_ticket_date_col_12").hide();

    $("#ticket_programmer_selected").select2().next().hide();
    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #C433FF;'>Waiting</span></h5></div>"
    );
  } else if (
    data.status_id == 2 ||
    data.status_id == 3 ||
    data.status_id == 4 ||
    data.status_id == 5
  ) {
    if (data.status_id == 2) {
      $("#form_activity").show();
      $("#btn_confirm_ticket").show();
      $("#ticket_programmer_selected").val(ticket_dev).change();
      $("#ticket_programmer_selected").prop("disabled", true);
      var programmer_name =
        $("#user_first_name").val() + " " + $("#user_last_name").val();
      $("#programmer_name").html(programmer_name);
      $("#btn_complete_ticket").hide();
      $("#status_head").append(
        "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #F7BA5E;'>Waiting Operator confirm</span></h5></div>"
      );
    } else {
      if (data.status_id == 3) {
        $("#form_label_programmer_name").show();
        $("#form_activity").hide();
        $("#btn_update_ticket").show();
        $("#status_head").append(
          "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #61D9FF;'>In Process</span></h5></div>"
        );
        data.ticket_attachment_dev == ""
          ? $("#add_file_dev").show()
          : $("#update_file_dev").show();
      } else {
        $("#form_activity_detail_button").hide();
        if (data.status_id == 4) {
          $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #7F5A58;'>Waiting Manager approve</span></h5></div>"
          );
          $("#update_file_dev").hide();
        } else if (data.status_id == 5) {
          $("#show_file_dev").hide();
          $("#form_activity").hide();
          $("#btn_revise_ticket").hide();
          $("#form_label_programmer_name").show();
          $("#label_ticket_attachment_dev_update").hide();
          $("#btn_revise_ticket").show();
          $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #FB95FB;'>Disapprove</span></h5></div>"
          );
        }
      }
      $("#form_activity_detail").show();
      $("#form_ticket_date_col_6").hide();
      $("#ticket_programmer_selected").prop("disabled", true);
      $("#ticket_programmer_selected").val(ticket_dev).change();

      if (data.ticket_attachment_dev) {
        $("#file_dev").show();
      }
    }
  } else if (data.status_id == 6) {
    $("#form_activity_detail_button").hide();
    $("#form_activity_detail").show();
    $("#form_ticket_date_col_6").hide();
    $("#ticket_programmer_selected").val(ticket_dev).change();

    $(".ratingW").prop("disabled", true);
    $("#ticket_programmer_selected").prop("disabled", true);

    $("#selected_approve_star_manager").show();

    var stars = $(".ratingW").find("li");
    for (let i = 0; i < data.ticket_rating; i++) {
      $(".scoreNow").html(data.ticket_rating);
      stars.eq(i).addClass("on");
    }

    $("#selected_approve_star_user").show();
    if (data.ticket_rating_user) {
      var stars2 = $(".ratingW2").find("li");
      for (let i = 0; i < data.ticket_rating_user; i++) {
        $(".scoreNow2").html(data.ticket_rating_user);
        stars2.eq(i).addClass("on");
      }
    }

    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #0FCA7A;'>Success</span></h5></div>"
    );
  } else if (data.status_id == 7) {
    $("#form_activity_detail").show();
    $("#label_programmer_name").hide();
    $("#form_ticket_date_col_6").hide();

    $("#ticket_start_date").prop("disabled", true);
    $("#ticket_due_date_manager").prop("disabled", true);

    $("#ticket_programmer_selected").select2().next().hide();
    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #F75D5F;'>Disapprove</span></h5></div>"
    );
  } else if (data.status_id == 8) {
    $("#form_ticket_date_col_6").hide();
    $("#ticket_programmer_selected").val(ticket_dev).change();
    $("#ticket_programmer_selected").prop("disabled", true);
    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #808080;'>Cancel</span></h5></div>"
    );
  } else if (data.status_id == 9) {
    if (data.ticket_attachment_user) {
      var attachFile_user = data.ticket_attachment_user.split("|");
      var attachFileName_user = [];
      for (let i = 0; i < attachFile_user.length; i++) {
        attachFileName_user[i] = attachFile_user[i].split("attachment/");
        attachOldFile.push(attachFileName_user[i][1]);
        attachUpdateFile.push(attachFileName_user[i][1]);
        if (i == 0) {
          $("#files_selected_reject").append('<ul class="ul_files">');
        }

        var list_files =
          '<li class="li_files_reject' +
          i +
          '" data-index="' +
          i +
          '"><div">' +
          attachFileName_user[i][1] +
          '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /><div style="float: right; cursor: pointer;">&nbsp;&nbsp;</div></div></li>';
        $("#files_selected_reject").append(list_files);

        if (i == attachFile_user.length - 1) {
          $("#files_selected_reject").append("</ul>");
        }
      }
    }

    $("#btn_reject_user").show();
    $("#form_reject_description").show();

    $("#form_type_category").hide();
    $("#form_start_end_date").hide();
    $("#form_severity_detail").hide();
    $("#label_programmer_name").hide();
    $("#form_estimate_due_date").hide();
    $("#form_ticket_date_col_12").hide();
    $("#file_user").hide();
    $("#form_file_user_reject").show();

    $("#ticket_objective").prop("disabled", false);
    $("#ticket_description").prop("disabled", false);

    $("#reject_description").val(data.reject_desciption);
    $("#ticket_programmer_selected").select2().next().hide();

    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #ff6f00;'>Reject</span></h5></div>"
    );
  } else if (data.status_id == 10) {
    $("#ticket_programmer_selected").val(ticket_dev).change();
    $("#ticket_programmer_selected").prop("disabled", true);
    $("#form_file_user_reject_to_approver").show();
    $("#selected_approve_star_manager").show();
    $("#selected_approve").hide();
    $("#selected_approve2").hide();
    $("#btn_approve_ticket").hide();
    $("#btn_approve_ticket2").hide();
    $("#ticket_reject_approver_note_detail").val(data.reject_user_desciption);
    $("#btn_accept_user_reject").show();
    $("#ticket_type_selected").prop("disabled", true);
    $("#ticket_category_selected").prop("disabled", true);

    $(".ratingW").prop("disabled", true);
    var stars = $(".ratingW").find("li");
    for (let i = 0; i < data.ticket_rating; i++) {
      $(".scoreNow").html(data.ticket_rating);
      stars.eq(i).addClass("on");
    }

    if (data.reject_user_attachment) {
      var attachFile_user = data.reject_user_attachment.split("|");
      var attachFileName_user = [];
      for (let i = 0; i < attachFile_user.length; i++) {
        attachFileName_user[i] = attachFile_user[i].split("attachment/");
        if (i == 0) {
          $("#files_selected_reject_to_approver").append(
            '<ul class="ul_files">'
          );
        }

        var list_files =
          '<li class="li_files' +
          i +
          '"><div">' +
          attachFileName_user[i][1] +
          '<a href="' +
          attachFile_user[i] +
          '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
        $("#files_selected_reject_to_approver").append(list_files);

        if (i == attachFile_user.length - 1) {
          $("#files_selected_reject_to_approver").append("</ul>");
        }
      }
    }
    $("#file_manager_signature").hide();

    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #DFD187;'>Waiting user approve</span></h5></div>"
    );
  } else if (data.status_id == 11) {
    $("#ticket_programmer_selected").val(ticket_dev).change();
    $("#ticket_programmer_selected").prop("disabled", true);
    $("#form_file_user_reject_to_approver").show();
    $("#selected_approve_star_manager").hide();
    $("#selected_approve").hide();
    $("#selected_approve2").hide();
    $("#btn_approve_ticket").hide();
    $("#btn_approve_ticket2").hide();
    $("#ticket_reject_approver_note_detail").val(data.reject_user_desciption);
    $("#btn_accept_user_reject").show();
    $("#ticket_type_selected").prop("disabled", true);
    $("#ticket_category_selected").prop("disabled", true);

    $(".ratingW").prop("disabled", true);
    var stars = $(".ratingW").find("li");
    for (let i = 0; i < data.ticket_rating; i++) {
      $(".scoreNow").html(data.ticket_rating);
      stars.eq(i).addClass("on");
    }

    if (data.reject_user_desciption) {
      $("#note_user_reject").show();
    }

    if (data.reject_user_attachment) {
      $("#file_user_reject").show();
      var attachFile_user = data.reject_user_attachment.split("|");
      var attachFileName_user = [];
      for (let i = 0; i < attachFile_user.length; i++) {
        attachFileName_user[i] = attachFile_user[i].split("attachment/");
        if (i == 0) {
          $("#files_selected_reject_to_approver").append(
            '<ul class="ul_files">'
          );
        }

        var list_files =
          '<li class="li_files' +
          i +
          '"><div">' +
          attachFileName_user[i][1] +
          '<a href="' +
          attachFile_user[i] +
          '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
        $("#files_selected_reject_to_approver").append(list_files);

        if (i == attachFile_user.length - 1) {
          $("#files_selected_reject_to_approver").append("</ul>");
        }
      }
    }
    $("#file_manager_signature").hide();

    $("#status_head").append(
      "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #B89169;'>User Reject</span></h5></div>"
    );
  }

  if (data.ticket_signature_user) {
    $("#ticket_sign_user").attr("src", data.ticket_signature_user);
  }

  if (data.ticket_signature_dev) {
    $("#ticket_sign_programmer").attr("src", data.ticket_signature_dev);
    $("#programmer_signature").hide();
    $("#clearSignProgrammer").hide();
  } else if (!data.ticket_signature_dev && data.status_id != 8) {
    $("#ticket_sign_programmer").hide();
    $("#file_programmer_signature").show();
    $("#programmer_signature").show();
    $("#programmer_signature").jSignature();
    $("#clearSignProgrammer").show();
  }

  diableInput();
  calculateProgress();
  $(".loader").hide();
}

function changeSign() {
  $("#manager_signature").bind("change", function (e) {
    if ($("#manager_signature").jSignature("getData", "native").length != 0) {
      $("#fileManagersignature").prop("disabled", true);
    } else {
      $("#fileManagersignature").prop("disabled", false);
    }
  });

  $("#fileManagersignature").on("change", function () {
    var filesign = $("#fileManagersignature").get(0).files[0];
    if (filesign) {
      $("#manager_signature").hide();
      $("#ticket_sign_manager").attr(
        "src",
        "../public/images/sign/sign_null.png"
      );
      $("#outputFileManagersignature").css("width", "517");
      $("#outputFileManagersignature").css("height", "129");
    } else {
      $("#manager_signature").show();
    }
  });

  $("#programmer_signature").bind("change", function (e) {
    if (
      $("#programmer_signature").jSignature("getData", "native").length != 0
    ) {
      $("#fileProgrammersignature").prop("disabled", true);
    } else {
      $("#fileProgrammersignature").prop("disabled", false);
    }
  });

  $("#fileProgrammersignature").on("change", function () {
    var filesign = $("#fileProgrammersignature").get(0).files[0];
    if (filesign) {
      $("#programmer_signature").hide();
      $("#ticket_sign_programmer").attr(
        "src",
        "../public/images/sign/sign_null.png"
      );
      $("#outputFileProgrammersignature").css("width", "517");
      $("#outputFileProgrammersignature").css("height", "129");
    } else {
      $("#programmer_signature").show();
    }
  });
}

function clearSign() {
  $("#clearSignManager").click(function (event) {
    $("#manager_signature").jSignature("reset");
    $("#fileManagersignature").prop("disabled", false);
    $("#manager_signature").show();
    $("#ticket_manager_signature").attr("src", "");
    $("#fileManagersignature").val("");
    $("#outputFileManagersignature").attr("src", "");
    $("#outputFileManagersignature").css("width", "0");
    $("#outputFileManagersignature").css("height", "0");
  });

  $("#clearSignProgrammer").click(function (event) {
    $("#programmer_signature").jSignature("reset");
    $("#fileProgrammersignature").prop("disabled", false);
    $("#programmer_signature").show();
    $("#ticket_programmer_signature").attr("src", "");
    $("#fileProgrammersignature").val("");
    $("#outputFileProgrammersignature").attr("src", "");
    $("#outputFileProgrammersignature").css("width", "0");
    $("#outputFileProgrammersignature").css("height", "0");
  });
}

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

function addTicketApprove() {
  $("#btn_approve_ticket").click(async function (e) {
    var ticket_start_date = $("#ticket_start_date").val();
    var ticket_severity_id = $("#severity_detail").val();
    var ticket_due_date_manager = $("#ticket_due_date_manager").val();
    var ticket_reject_note = $("#ticket_reject_note").val();
    var programmer = $("#ticket_programmer_selected").select2("data");
    var ticket_type_id = $("#ticket_type_selected").select2("data");
    var ticket_category_id = $("#ticket_category_selected").select2("data");
    var ticket_programmer = "";
    var update_dev = "";
    var ticket_rating = "";
    for (let i = 0; i < programmer.length; i++) {
      ticket_programmer += programmer[i].id;
      if (i != programmer.length - 1) {
        ticket_programmer += ",";
      }
    }
    let status_id = 1;
    var ticket_id = getUrlParameter("ticket_id");
    var msg = "";

    if (
      $("#Approve").is(":checked") ||
      $("#Disapprove").is(":checked") ||
      $("#Reject").is(":checked")
    ) {
      if ($("#Approve").is(":checked")) {
        status_id = 2;
        msg = "Yes, approve ticket!";
      } else if ($("#Disapprove").is(":checked")) {
        status_id = 7;
        msg = "Yes, disapprove ticket!";
      } else if ($("#Reject").is(":checked")) {
        status_id = 9;
        msg = "Yes, reject ticket!";
      }

      // get the element where the signature have been put
      var msg2 = "";
      var $sigdiv = $("#manager_signature");
      if ($sigdiv.jSignature("getData", "native").length == 0) {
        var file = $("#fileManagersignature").get(0).files[0];
        if (file) {
          var filesignuser = await toBase64(file);
        } else {
          var filesignuser = "";
        }
        //console.log(filesignuser)
      }
      if (
        (!ticket_start_date && status_id == 2) ||
        (!ticket_due_date_manager && status_id == 2) ||
        (programmer.length == 0 && status_id == 2) ||
        ($sigdiv.jSignature("getData", "native").length == 0 &&
          !filesignuser) ||
        (ticket_severity_id == null && status_id == 2) ||
        (ticket_reject_note == "" && status_id == 9) ||
        (!ticket_type_id && status_id == 2) ||
        (!ticket_category_id && status_id == 2)
      ) {
        if (!ticket_start_date && status_id == 2) {
          msg2 = "Ticket start date";
        } else if (!ticket_due_date_manager && status_id == 2) {
          msg2 = "Ticket due date";
        } else if (programmer.length == 0 && status_id == 2) {
          msg2 = "Operator";
        } else if (
          $sigdiv.jSignature("getData", "native").length == 0 &&
          !filesignuser
        ) {
          msg2 = "Signature";
        } else if (ticket_severity_id == null && status_id == 2) {
          msg2 = "Severity";
        } else if (ticket_reject_note == "" && status_id == 9) {
          msg2 = "Reject Note";
        } else if (!ticket_type_id && status_id == 2) {
          msg2 = "Ticket type";
        } else if (!ticket_category_id && status_id == 2) {
          msg2 = "Ticket category";
        }

        Swal.fire({
          icon: "warning",
          title: "Warning!",
          text: "Please enter " + msg2,
        });
      } else {
        if ($sigdiv.jSignature("getData", "native").length != 0) {
          // get a base64 URL for a SVG picture
          var data_signature = $sigdiv.jSignature("getData");
        } else {
          var data_signature = filesignuser;
        }

        //console.log(ticket_start_date,ticket_due_date_manager,ticket_programmer,status_id,data_signature)

        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#04AA6D",
          cancelButtonColor: "#d9534f",
          confirmButtonText: msg,
        }).then((result) => {
          if (result.isConfirmed) {
            $(".loader").show();
            $("#btn_approve_ticket").prop("disabled", true);
            axios
              .post("/api/updateApproveTicket", {
                ticket_id: ticket_id,
                ticket_start_date: ticket_start_date,
                ticket_due_date_manager: ticket_due_date_manager,
                ticket_programmer: ticket_programmer,
                status_id: status_id,
                data_signature: data_signature,
                ticket_severity_id: ticket_severity_id,
                ticket_type_id: ticket_type_id,
                ticket_category_id: ticket_category_id,
                reject_remark: ticket_reject_note,
              })
              .then((response) => {
                addSuccess();
                $("#btn_approve_ticket").prop("disabled", false);
                lineNotify(
                  response.data.ticket_no,
                  response.data.ticket_name,
                  status_id,
                  response.data.user_firstname,
                  response.data.user_lastname,
                  response.data.user_email,
                  response.data.dev_name,
                  update_dev,
                  ticket_rating,
                  response.data.ticket_start_date,
                  "",
                  response.data.due_date_manager
                );
              })
              .catch((err) => {
                $(".loader").hide();
                $("#btn_approve_ticket").prop("disabled", false);
                Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: err,
                });
              });
          }
        });
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please select Approve/Disapprove",
      });
    }
  });
}

function addTicketConfirm() {
  $("#btn_confirm_ticket").click(async function (e) {
    const inputs = document.querySelectorAll('input[name="input[]"]');
    const task_activitys = Array.from(inputs).map((input) => input.value);

    const tasks = task_activitys.filter((item) => item.trim() !== "");

    let status_id = 3;
    var ticket_id = getUrlParameter("ticket_id");
    var update_dev = "";
    var ticket_rating = "";
    var ticket_department_id = $("#ticket_department_selected").val();

    // get the element where the signature have been put
    var $sigdiv = $("#programmer_signature");
    if ($sigdiv.jSignature("getData", "native").length == 0) {
      var file = $("#fileProgrammersignature").get(0).files[0];
      if (file) {
        var filesigndev = await toBase64(file);
      } else {
        var filesigndev = "";
      }
      //console.log(filesigndev)
    }
    if ($sigdiv.jSignature("getData", "native").length == 0 && !filesigndev) {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter signature",
      });
    } else if (tasks.length == 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter task activity",
      });
    } else {
      if ($sigdiv.jSignature("getData", "native").length != 0) {
        // get a base64 URL for a SVG picture
        var data_signature = $sigdiv.jSignature("getData");
      } else {
        var data_signature = filesigndev;
      }

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, confirm ticket!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_confirm_ticket").prop("disabled", true);
          axios
            .post("/api/updateConfirmTicket", {
              ticket_id: ticket_id,
              status_id: status_id,
              data_signature: data_signature,
              task_activitys: tasks,
              ticket_department_id: ticket_department_id,
            })

            .then((response) => {
              addSuccess();
              $("#btn_confirm_ticket").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_confirm_ticket").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    }
  });
}

function updateTicketConfirm() {
  $("#btn_update_ticket").click(async function (e) {
    var user_type = $("#user_type").val();
    const inputs = document.querySelectorAll('input[name="input-detail[]"]');
    const task_activitys = Array.from(inputs).map((input) => input);

    const checkboxes = document.querySelectorAll('input[name="checkbox[]"]');
    const inputChecked = Array.from(checkboxes).map(
      (checkbox) => checkbox.checked
    );

    let progress = calculateProgress();
    let status_id = progress == 100 ? 4 : 3;
    let ticket_id = getUrlParameter("ticket_id");
    let action_type = "update";
    let ticket_department_id = $("#ticket_department_selected").val();
    let update_dev = "";
    let ticket_rating = "";

    let fileAttach = "";
    let filetype = "";
    let fileAttachType = "";
    let fileName = "";
    let fileLocalRemove = "";
    let newFiles = [];
    let oldFileNames = "";
    let fileAttachType_dev = "";

    var manager_tk = "";

    if (user_type == 3 || (user_type == 4 && ticket_level_id == 2)) {
      for (let i = 0; i < devDB.length; i++) {
        if (managerTicket == devDB[i]) {
          action_type = "update";
          manager_tk = "same";
          break;
        }
      }
    }

    if (attachOldFile.length) {
      fileLocalRemove = attachOldFile
        .filter((f) => typeof f === "string" && !attachUpdateFile.includes(f))
        .join(",");
    }

    var rating_score = $(".scoreNow").html();

    const all_task = task_activitys.map((item, idx) => {
      return {
        task_activity_id: item.dataset.id || "",
        task_activity_description: item.value,
        task_activity_complete: inputChecked[idx] ? 1 : 0,
      };
    });

    const tasks = all_task.filter(
      (item) => item.task_activity_description.trim() !== ""
    );

    if (tasks.length == 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter task activity",
      });
    } else if (
      (user_type == 3 || (user_type == 4 && ticket_level_id == 2)) &&
      rating_score == 0 &&
      status_id == 4 &&
      action_type == "update" &&
      manager_tk == "same"
    ) {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter performance rating",
      });
    } else {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, update ticket!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_update_ticket").prop("disabled", true);
          if (attachFile.length != 0) {
            for (let i = 0; i < attachFile.length; i++) {
              filetype = attachFile[i].name.split(/\.(?=[^\.]+$)/);
              if (i != 0) {
                fileAttach += "|";
                fileAttachType += "|";
                fileName += "|";
              }
              fileAttach += await toBase64(attachFile[i]);
              fileAttachType += filetype[1];
              fileName += filetype[0];
            }
          } else if (attachUpdateFile.length) {
            newFiles = attachUpdateFile.filter((f) => typeof f === "object");
            oldFileNames = attachUpdateFile
              .filter((f) => typeof f === "string")
              .join(",");
            for (let i = 0; i < newFiles.length; i++) {
              filetype = newFiles[i].name.split(/\.(?=[^\.]+$)/);
              if (i != 0) {
                fileAttach += "|";
                fileAttachType += "|";
                fileName += "|";
              }
              fileAttach += await toBase64(newFiles[i]);
              fileAttachType += filetype[1];
              fileName += filetype[0];
            }
          } else {
            fileAttachType_dev = null;
            ticket_attachment_dev = null;
          }

          if (status_id == 4) {
            axios
              .post("/api/updateCompleteTicket", {
                ticket_id,
                status_id,
                action_type,
                ticket_attachment_dev: fileAttach,
                fileAttachType_dev: fileAttachType,
                fileName_dev: fileName,
                fileLocalRemove: fileLocalRemove,
                oldFileNames: oldFileNames,
                task_activitys: tasks,
                rating_score: rating_score,
                ticket_department_id: ticket_department_id,
                ticket_level_id: ticket_level_id,
                manager_tk: manager_tk,
              })
              .then((response) => {
                addSuccess();
                $("#btn_update_ticket").prop("disabled", false);
                lineNotify(
                  response.data.ticket_no,
                  response.data.ticket_name,
                  status_id,
                  response.data.user_firstname,
                  response.data.user_lastname,
                  response.data.user_email,
                  response.data.dev_name,
                  update_dev,
                  ticket_rating,
                  response.data.ticket_start_date,
                  "",
                  response.data.due_date_manager
                );
              })
              .catch((err) => {
                $(".loader").hide();
                $("#btn_update_ticket").prop("disabled", false);
                Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: err,
                });
              });
          } else {
            axios
              .post("/api/updateCompleteTicket", {
                ticket_id,
                status_id,
                action_type,
                ticket_attachment_dev: fileAttach,
                fileAttachType_dev: fileAttachType,
                fileName_dev: fileName,
                fileLocalRemove: fileLocalRemove,
                oldFileNames: oldFileNames,
                task_activitys: tasks,
                rating_score: rating_score,
                ticket_department_id: ticket_department_id,
              })
              .then((response) => addSuccess())
              .catch((err) =>
                Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: err,
                })
              );
          }
        }
      });
    }
  });
}

function addTicketApproveConfirm() {
  $("#btn_approve_confirm").click(async function (e) {
    var ticket_start_date = $("#ticket_start_date").val();
    var ticket_due_date_manager = $("#ticket_due_date_manager").val();
    var programmer = $("#ticket_programmer_selected").select2("data");
    var ticket_programmer = "";
    var update_dev = "";
    var ticket_rating = "";
    for (let i = 0; i < programmer.length; i++) {
      ticket_programmer += programmer[i].id;
      if (i != programmer.length - 1) {
        ticket_programmer += ",";
      }
    }

    let status_id = 3;
    var ticket_id = getUrlParameter("ticket_id");
    var msg = "";
    // get the element where the signature have been put
    var msg2 = "";
    var $sigdiv = $("#manager_signature");
    if ($sigdiv.jSignature("getData", "native").length == 0) {
      var file = $("#fileManagersignature").get(0).files[0];
      if (file) {
        var filesignmanager = await toBase64(file);
      } else {
        var filesignmanager = "";
      }
      // console.log(filesignmanager)
    }

    var $sigdivdev = $("#programmer_signature");
    if ($sigdivdev.jSignature("getData", "native").length == 0) {
      var file_dev = $("#fileProgrammersignature").get(0).files[0];
      if (file_dev) {
        var filesigndev = await toBase64(file_dev);
      } else {
        var filesigndev = "";
      }
      // console.log(filesigndev)
    }

    if (
      (!ticket_start_date && status_id == 3) ||
      (!ticket_due_date_manager && status_id == 3) ||
      (programmer.length == 0 && status_id == 3) ||
      ($sigdiv.jSignature("getData", "native").length == 0 &&
        !filesignmanager) ||
      ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
    ) {
      if (!ticket_start_date && status_id == 3) {
        msg2 = "Ticket start date";
      } else if (!ticket_due_date_manager && status_id == 3) {
        msg2 = "Ticket due date";
      } else if (programmer.length == 0 && status_id == 3) {
        msg2 = "Operator";
      } else if (
        ($sigdiv.jSignature("getData", "native").length == 0 &&
          !filesignmanager) ||
        ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
      ) {
        msg2 = "Signature";
      }

      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter " + msg2,
      });
    } else {
      if ($sigdiv.jSignature("getData", "native").length != 0) {
        // get a base64 URL for a SVG picture
        var data_signature = $sigdiv.jSignature("getData");
      } else {
        data_signature = filesignmanager;
      }
      if ($sigdivdev.jSignature("getData", "native").length != 0) {
        // get a base64 URL for a SVG picture
        var data_signature_dev = $sigdivdev.jSignature("getData");
      } else {
        data_signature_dev = filesigndev;
      }

      console.log(
        ticket_start_date,
        ticket_due_date_manager,
        ticket_programmer,
        status_id,
        data_signature,
        data_signature_dev
      );

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, confirm ticket!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_approve_confirm").prop("disabled", true);
          axios
            .post("/api/updateApproveConfirm", {
              ticket_id: ticket_id,
              ticket_start_date: ticket_start_date,
              ticket_due_date_manager: ticket_due_date_manager,
              ticket_programmer: ticket_programmer,
              status_id: status_id,
              data_signature: data_signature,
              data_signature_dev: data_signature_dev,
            })

            .then((response) => {
              addSuccess();
              $("#btn_changedev_confirm").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_approve_confirm").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    }
  });
}

function addTicketChangedevConfirm() {
  $("#btn_changedev_confirm").click(async function (e) {
    var programmer = $("#ticket_programmer_selected").select2("data");
    var ticket_programmer = "";
    var update_dev = "";
    var ticket_rating = "";
    for (let i = 0; i < programmer.length; i++) {
      ticket_programmer += programmer[i].id;
      if (i != programmer.length - 1) {
        ticket_programmer += ",";
      }
    }

    let status_id = 3;
    var ticket_id = getUrlParameter("ticket_id");
    var ticket_department_id = $("#ticket_department_selected").val();
    var msg = "";
    // get the element where the signature have been put
    var msg2 = "";
    var ticket_sign_manager = $("#ticket_sign_manager").attr("src");
    console.log(ticket_sign_manager);

    var $sigdivdev = $("#programmer_signature");
    if ($sigdivdev.jSignature("getData", "native").length == 0) {
      var file_dev = $("#fileProgrammersignature").get(0).files[0];
      if (file_dev) {
        var filesigndev = await toBase64(file_dev);
      } else {
        var filesigndev = "";
      }
      // console.log(filesigndev)
    }

    if (
      (programmer.length == 0 && status_id == 3) ||
      ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
    ) {
      if (programmer.length == 0 && status_id == 3) {
        msg2 = "Operator";
      } else if (
        !ticket_sign_manager ||
        ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
      ) {
        msg2 = "Signature";
      }

      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter " + msg2,
      });
    } else {
      if ($sigdivdev.jSignature("getData", "native").length != 0) {
        // get a base64 URL for a SVG picture
        var data_signature_dev = $sigdivdev.jSignature("getData");
      } else {
        data_signature_dev = filesigndev;
      }

      console.log(ticket_programmer, status_id, data_signature_dev);

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, confirm ticket!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_changedev_confirm").prop("disabled", true);
          axios
            .post("/api/updateChangedevConfirm", {
              ticket_id: ticket_id,
              ticket_programmer: ticket_programmer,
              status_id: status_id,
              data_signature_dev: data_signature_dev,
              ticket_department_id: ticket_department_id,
            })

            .then((response) => {
              addSuccess();
              $("#btn_changedev_confirm").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_changedev_confirm").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    }
  });
}

function addTicketComplete() {
  $("#btn_complete_ticket").click(async function (e) {
    // check if task activity is all checked status is 4
    var ticket_department_id = $("#ticket_department_selected").val();
    const taskComplete = false;
    const status_id = taskComplete ? 4 : 3;
    const action_type = "update";
    var ticket_id = getUrlParameter("ticket_id");
    var update_dev = "";
    var ticket_rating = "";

    var fileAttach = "";
    var filetype = "";
    var fileAttachType = "";
    var fileName = "";
    var fileLocalRemove = "";

    if (attachOldFile.length) {
      fileLocalRemove = attachOldFile
        .filter((f) => typeof f === "string" && !attachUpdateFile.includes(f))
        .join(",");
    }

    if (attachFile.length != 0) {
      for (let i = 0; i < attachFile.length; i++) {
        filetype = attachFile[i].name.split(/\.(?=[^\.]+$)/);
        if (i != 0) {
          fileAttach += "|";
          fileAttachType += "|";
          fileName += "|";
        }
        fileAttach += await toBase64(attachFile[i]);
        fileAttachType += filetype[1];
        fileName += filetype[0];
      }

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, ticket completed!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_complete_ticket").prop("disabled", true);
          axios
            .post("/api/updateCompleteTicket", {
              ticket_id: ticket_id,
              status_id: status_id,
              ticket_attachment_dev: fileAttach,
              fileAttachType_dev: fileAttachType,
              fileName_dev: fileName,
              action_type: action_type,
              ticket_department_id: ticket_department_id,
            })
            .then((response) => {
              addSuccess();
              $("#btn_complete_ticket").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_complete_ticket").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    } else if (attachUpdateFile.length) {
      const newFiles = attachUpdateFile.filter((f) => typeof f === "object");
      const oldFileNames = attachUpdateFile
        .filter((f) => typeof f === "string")
        .join(",");
      for (let i = 0; i < newFiles.length; i++) {
        filetype = newFiles[i].name.split(/\.(?=[^\.]+$)/);
        if (i != 0) {
          fileAttach += "|";
          fileAttachType += "|";
          fileName += "|";
        }
        fileAttach += await toBase64(newFiles[i]);
        fileAttachType += filetype[1];
        fileName += filetype[0];
      }

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, ticket completed!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_complete_ticket").prop("disabled", true);
          axios
            .post("/api/updateCompleteTicket", {
              ticket_id: ticket_id,
              status_id: status_id,
              ticket_attachment_dev: fileAttach,
              fileAttachType_dev: fileAttachType,
              fileName_dev: fileName,
              action_type: action_type,
              fileLocalRemove: fileLocalRemove,
              oldFileNames: oldFileNames,
              ticket_department_id: ticket_department_id,
            })
            .then((response) => {
              addSuccess();
              $("#btn_complete_ticket").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_complete_ticket").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    } else {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, ticket completed!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_complete_ticket").prop("disabled", true);
          axios
            .post("/api/updateCompleteTicket", {
              ticket_id: ticket_id,
              status_id: status_id,
              ticket_attachment_dev: null,
              fileAttachType_dev: null,
              action_type: action_type,
              fileLocalRemove: fileLocalRemove,
              ticket_department_id: ticket_department_id,
            })
            .then((response) => {
              addSuccess();
              $("#btn_complete_ticket").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                "",
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_complete_ticket").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    }
  });
}

function addTicketApprove2() {
  var ticket_department_id = $("#ticket_department_selected").val();
  var $selectAll = $("input:radio[name=inlineRadioOptions2]");
  var user_type = $("#user_type").val();
  $selectAll.on("change", function () {
    if ($(this).val() == "Approve" && user_type == 3) {
      status_id = 6;
      $("#textarea_note_disapprove").hide();
      var rating_score = $(".scoreNow").html("0");
      $("#selected_approve_star_manager").show();
    } else {
      status_id = 5;
      $("#textarea_note_disapprove").show();
      $("#selected_approve_star_manager").hide();
      var stars = $(".ratingW").find("li");
      stars.removeClass("on");
      var rating_score = $(".scoreNow").html("0");
    }
  });

  $("#btn_approve_ticket2").click(function (e) {
    let status_id = 4;
    var ticket_id = getUrlParameter("ticket_id");
    var rating_score = $(".scoreNow").html();
    var msg = "";
    var ticket_note = $("#ticket_disapprove_note").val();
    var update_dev = "";
    var ticket_rating = "";

    console.log(rating_score);

    if ($("#Approve2").is(":checked") || $("#Disapprove2").is(":checked")) {
      if ($("#Approve2").is(":checked")) {
        status_id = 6;
        msg = "Yes, approve ticket!";
        if (rating_score != 0) {
          Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#04AA6D",
            cancelButtonColor: "#d9534f",
            confirmButtonText: msg,
          }).then((result) => {
            if (result.isConfirmed) {
              $(".loader").show();
              $("#btn_approve_ticket2").prop("disabled", true);
              axios
                .post("/api/updateApproveTicket2", {
                  ticket_id: ticket_id,
                  status_id: status_id,
                  rating_score: rating_score,
                  ticket_note: ticket_note,
                  ticket_department_id: ticket_department_id,
                })

                .then((response) => {
                  addSuccess();
                  $("#btn_approve_ticket2").prop("disabled", false);
                  lineNotify(
                    response.data.ticket_no,
                    response.data.ticket_name,
                    status_id,
                    response.data.user_firstname,
                    response.data.user_lastname,
                    response.data.user_email,
                    response.data.dev_name,
                    update_dev,
                    ticket_rating,
                    response.data.ticket_start_date,
                    response.data.ticket_end_date,
                    response.data.due_date_manager
                  );
                })
                .catch((err) => {
                  $(".loader").hide();
                  $("#btn_approve_ticket2").prop("disabled", false);
                  Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: err,
                  });
                });
            }
          });
        } else {
          Swal.fire({
            icon: "warning",
            title: "Warning!",
            text: "Please enter performance rating",
          });
        }
      } else if ($("#Disapprove2").is(":checked")) {
        status_id = 5;
        msg = "Yes, disapprove ticket!";
        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#04AA6D",
          cancelButtonColor: "#d9534f",
          confirmButtonText: msg,
        }).then((result) => {
          if (result.isConfirmed) {
            $(".loader").show();
            $("#btn_approve_ticket2").prop("disabled", true);
            axios
              .post("/api/updateApproveTicket2", {
                ticket_id: ticket_id,
                status_id: status_id,
                rating_score: rating_score,
                ticket_note: ticket_note,
                ticket_department_id: ticket_department_id,
              })

              .then((response) => {
                addSuccess();
                $("#btn_approve_ticket2").prop("disabled", false);
                lineNotify(
                  response.data.ticket_no,
                  response.data.ticket_name,
                  status_id,
                  response.data.user_firstname,
                  response.data.user_lastname,
                  response.data.user_email,
                  response.data.dev_name,
                  update_dev,
                  ticket_rating,
                  response.data.ticket_start_date,
                  response.data.ticket_end_date,
                  response.data.due_date_manager
                );
              })
              .catch((err) => {
                $(".loader").hide();
                $("#btn_approve_ticket2").prop("disabled", false);
                Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: err,
                });
              });
          }
        });
      }

      //console.log(status_id,ticket_id,rating_score,ticket_note);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please select Approve/Disapprove",
      });
    }
  });
}

function addTicketSuccess() {
  $("#btn_success").click(function (e) {
    let status_id = 6;
    var ticket_id = getUrlParameter("ticket_id");
    var rating_score = $(".scoreNow").html();
    var ticket_note = "";
    var update_dev = "";
    var ticket_rating = "";

    console.log(rating_score);

    if (rating_score != 0) {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, approve ticket!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_success").prop("disabled", true);
          axios
            .post("/api/updateApproveTicket2", {
              ticket_id: ticket_id,
              status_id: status_id,
              rating_score: rating_score,
              ticket_note: ticket_note,
            })

            .then((response) => {
              addSuccess();
              $("#btn_success").prop("disabled", false);
              lineNotify(
                response.data.ticket_no,
                response.data.ticket_name,
                status_id,
                response.data.user_firstname,
                response.data.user_lastname,
                response.data.user_email,
                response.data.dev_name,
                update_dev,
                ticket_rating,
                response.data.ticket_start_date,
                response.data.ticket_end_date,
                response.data.due_date_manager
              );
            })
            .catch((err) => {
              $(".loader").hide();
              $("#btn_success").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
              });
            });
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter performance rating",
      });
    }
  });
}

function rejectTicket() {
  $("#btn_reject_user").click(async function (e) {
    const status_id = 1;
    const ticket_id = getUrlParameter("ticket_id");
    const ticket_objective = $("#ticket_objective").val();
    const ticket_description = $("#ticket_description").val();
    const ticket_no = $("#ticket_no").val();
    const ticket_name = $("#ticket_name").val();
    const ticket_project_code = $("#ticket_project_code").val();
    var ticket_project_name = $("#ticket_project_name").val();

    var is_checked = $("#ticket_project_name_other_checkbox").is(":checked");
    if (is_checked) {
      ticket_project_name = $("#ticket_project_name_other").val();
    }

    console.log("is_checked :: ", is_checked);
    console.log("ticket_project_name :: ", ticket_project_name);

    const newFiles = attachUpdateFile.filter((f) => typeof f === "object");
    const oldFileNames = attachUpdateFile
      .filter((f) => typeof f === "string")
      .join(",");

    let fileAttach = "",
      filetype = "",
      fileAttachType = "",
      fileName = "",
      fileLocalRemove = "";

    for (let i = 0; i < newFiles.length; i++) {
      filetype = newFiles[i].name.split(/\.(?=[^\.]+$)/);
      if (i != 0) {
        fileName += "|";
        fileAttach += "|";
        fileAttachType += "|";
      }

      fileName += filetype[0];
      fileAttachType += filetype[1];
      fileAttach += await toBase64(newFiles[i]);
    }

    if (attachOldFile.length) {
      fileLocalRemove = attachOldFile
        .filter((f) => typeof f === "string" && !attachUpdateFile.includes(f))
        .join(",");
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#04AA6D",
      cancelButtonColor: "#d9534f",
      confirmButtonText: "Yes, submit update reject ticket!",
    }).then((result) => {
      if (result.isConfirmed) {
        $(".loader").show();
        $("#btn_reject_user").prop("disabled", true);
        axios
          .post("/api/updateRejectTicket", {
            ticket_id,
            status_id,
            ticket_objective,
            ticket_description,
            ticket_attachment: fileAttach,
            fileAttachType: fileAttachType,
            fileName: fileName,
            fileLocalRemove: fileLocalRemove,
            oldFileNames: oldFileNames,
            ticket_project_name: ticket_project_name,
          })
          .then((response) => {
            addSuccess();
            $("#btn_reject_user").prop("disabled", false);
            lineNotify(ticket_no, ticket_name, status_id);
          })
          .catch((err) => {
            $(".loader").hide();
            $("#btn_reject_user").prop("disabled", false);
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: err,
            });
          });
      }
    });
  });
}

function reviseTicket() {
  $("#btn_revise_ticket").click(function (e) {
    var ticket_department_id = $("#ticket_department_selected").val();
    let status_id = 3;
    let action_type = "revise";
    var ticket_id = getUrlParameter("ticket_id");
    var update_dev = "";
    var ticket_rating = "";
    var ticket_department_id = $("#ticket_department_selected").val();
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#04AA6D",
      cancelButtonColor: "#d9534f",
      confirmButtonText: "Yes, revise ticket!",
    }).then((result) => {
      if (result.isConfirmed) {
        $(".loader").show();
        $("#btn_revise_ticket").prop("disabled", true);
        axios
          .post("/api/updateCompleteTicket", {
            ticket_id: ticket_id,
            status_id: status_id,
            action_type: action_type,
            ticket_department_id: ticket_department_id,
          })

          .then((response) => {
            addSuccess();
            $("#btn_revise_ticket").prop("disabled", false);
            lineNotify(
              response.data.ticket_no,
              response.data.ticket_name,
              status_id,
              response.data.user_firstname,
              response.data.user_lastname,
              response.data.user_email,
              response.data.dev_name,
              update_dev,
              ticket_rating,
              response.data.ticket_start_date,
              "",
              response.data.due_date_manager
            );
          })
          .catch((err) => {
            $(".loader").hide();
            $("#btn_revise_ticket").prop("disabled", false);
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: err,
            });
          });
      }
    });
  });
}

function addRatingSuccess() {
  Swal.fire({
    title: "Success!",
    text: "Your satisfaction rating has been added.",
    icon: "success",
    didOpen: () => {
      Swal;
    },
  }).then(function () {
    window.location.href = "/dashboardUser";
  });
}

function lineNotify(
  ticket_no,
  ticket_name,
  status_id,
  user_firstname,
  user_lastname,
  user_email,
  dev_name,
  update_dev,
  ticket_rating,
  ticket_start_date,
  ticket_end_date,
  due_date_manager
) {
  axios
    .post("/api/LineNotify", {
      status_id: status_id,
      ticket_no: ticket_no,
      user_first_name: user_firstname,
      user_last_name: user_lastname,
      user_email: user_email,
      ticket_name: ticket_name,
      dev_name: dev_name,
      update_dev: update_dev,
      ticket_rating: ticket_rating,
      ticket_start_date: ticket_start_date,
      ticket_end_date: ticket_end_date,
      ticket_due_date: due_date_manager,
    })
    .then((response) => {})
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      })
    );
}

function addSuccess() {
  $(".loader").hide();
  Swal.fire({
    title: "Success!",
    text: "Your ticket has been updated.",
    icon: "success",
  }).then(function () {
    window.location.href = "/dashboardOperator";
  });
}

function changeDev() {
  $("#btn_edit_dev").click(function (e) {
    // console.log(devDB);
    var ticket_id = getUrlParameter("ticket_id");
    var programmer = $("#ticket_programmer_selected").select2("data");
    var update_dev = 1;
    var ticket_rating = "";
    // console.log(programmer);
    var ticket_programmer = "";
    if (programmer.length != 0) {
      if (devDB.length == programmer.length) {
        let dup = 0;
        for (let i = 0; i < devDB.length; i++) {
          if (devDB[i] == programmer[i].id) {
            dup = dup + 1;
          }
        }

        if (dup == devDB.length) {
          Swal.fire({
            icon: "warning",
            title: "Warning!",
            text: "No programmer changes",
          });
        } else {
          changeDev2(
            ticket_id,
            programmer,
            update_dev,
            ticket_rating,
            ticket_programmer
          );
        }
      } else {
        changeDev2(
          ticket_id,
          programmer,
          update_dev,
          ticket_rating,
          ticket_programmer
        );
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please select operator",
      });
    }
  });
}

function changeDev2(
  ticket_id,
  programmer,
  update_dev,
  ticket_rating,
  ticket_programmer
) {
  var ticket_department_id = $("#ticket_department_selected").val();
  for (let i = 0; i < programmer.length; i++) {
    ticket_programmer += programmer[i].id;
    if (i != programmer.length - 1) {
      ticket_programmer += ",";
    }
  }

  let status_id = 2;
  //console.log(ticket_programmer,status_id);

  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#04AA6D",
    cancelButtonColor: "#d9534f",
    confirmButtonText: "Yes, change Operator!",
  }).then((result) => {
    if (result.isConfirmed) {
      $(".loader").show();
      axios
        .post("/api/updateDev", {
          ticket_id: ticket_id,
          ticket_programmer: ticket_programmer,
          status_id: status_id,
          ticket_department_id: ticket_department_id,
        })

        .then((response) => {
          addSuccess();
          $("#btn_edit_dev").prop("disabled", false);
          lineNotify(
            response.data.ticket_no,
            response.data.ticket_name,
            status_id,
            response.data.user_firstname,
            response.data.user_lastname,
            response.data.user_email,
            response.data.dev_name,
            update_dev,
            ticket_rating,
            response.data.ticket_start_date,
            "",
            response.data.due_date_manager
          );
        })
        .catch((err) => {
          $(".loader").hide();
          $("#btn_edit_dev").prop("disabled", false);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: err,
          });
        });
    }
  });
}

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
    }
  }
  return false;
}

function ratingStar(star) {
  star.click(function () {
    var stars = $(".ratingW").find("li");
    stars.removeClass("on");
    var thisIndex = $(this).parents("li").index();
    for (var i = 0; i <= thisIndex; i++) {
      stars.eq(i).addClass("on");
    }
    putScoreNow(thisIndex + 1);
  });
}

function putScoreNow(i) {
  $(".scoreNow").html(i);
}

function setRating() {
  if ($(".ratingW").length > 0) {
    ratingStar($(".ratingW li a"));
  }
}

///////////////////////////////////////////////////////////

function ratingStarUser(star) {
  star.click(function () {
    var stars = $(".ratingW2").find("li");
    stars.removeClass("on");
    var thisIndex = $(this).parents("li").index();
    for (var i = 0; i <= thisIndex; i++) {
      stars.eq(i).addClass("on");
    }
    putScoreNowUser(thisIndex + 1);
  });
}

function putScoreNowUser(i) {
  $(".scoreNow2").html(i);
}

function setRatingUser() {
  if ($(".ratingW2").length > 0) {
    ratingStarUser($(".ratingW2 li a"));
  }
}
