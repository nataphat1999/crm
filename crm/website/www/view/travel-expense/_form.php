<?php
use yii\helpers\Html;
use yii\widgets\ActiveForm;
use app\models\TravelExpenseItem;
?>

<div class="travel-expense-form">

    <?php $form = ActiveForm::begin([
        'id' => 'travel-expense-form',
        'options' => ['enctype' => 'multipart/form-data'],
        'enableAjaxValidation' => false,
        'enableClientValidation' => true,
    ]); ?>

    <?= $this->render('_main_form', [
        'model' => $model,
        'form' => $form,
        'payToUsers' => $payToUsers,
        'users' => $users,
        'departments' => $departments,
        'projects' => $projects,
        'positions' => $positions,
        'usersData' => $usersData,
        'payeesData' => $payeesData,
        'projectsJson' => $projectsJson,
        'modelsApproval' => $modelsApproval,
    ]) ?>

    <?= $this->render('_item_table', [
        'model' => $model,
        'form' => $form,
        'modelsItem' => $modelsItem,
        'projects' => $projects, 
        'projectsJson' => $projectsJson,
        'listAccount' => $listAccount ?? [],
        'listType' => $listType ?? [],
        'modelItem' => $modelItem ?? null,
        'listItems' => $listItems ?? [],
    ]) ?>

    <?= $this->render('_signature_section', [
        'model' => $model,
        'isNewRecord' => $model->isNewRecord,
        'signaturesData' => $signaturesData,
        'modelsApproval' => $modelsApproval,
        'users' => $users,
        'level3Approvers' => $level3Approvers,
        'level5Approvers' => $level5Approvers,
    ]) ?>

    <?php ActiveForm::end(); ?>

</div>