from flask import Blueprint, request, jsonify
from flask_cors import cross_origin # Assuming CORS is handled at the app level, but good to have
from ..utils.auth import login_required # Corrected import for login_required decorator
# from ..models.repositories import SavedPackagesRepository # Will need a repository
# from ..config.settings import INDEX_SAVED_PACKAGES # Will need a setting for index name
import uuid # Import uuid for generating IDs
import logging # Import logging

logger = logging.getLogger(__name__)

saved_packages_bp = Blueprint('saved_packages', __name__)

# Initialize repository (will need actual implementation)
# saved_packages_repo = SavedPackagesRepository()

@saved_packages_bp.route('/', methods=['POST']) # Corrected route
@cross_origin() # Or handle CORS at app level
@login_required # Use the correct decorator
def save_package(current_user):
    """Saves a user-composed package."""
    data = request.json
    if not data:
        logger.warning("Save package request received with no data.")
        return jsonify({'message': 'Invalid input: missing package data'}), 400

    # Add user ID to the package data
    package_to_save = data
    # Ensure userId is a string if your backend expects it
    package_to_save['userId'] = str(current_user['_id'])
    # Generate a unique ID for the saved package if not already present or if frontend ID is temporary
    # You might want to refine this ID generation logic based on your needs
    if 'id' not in package_to_save or package_to_save.get('id', '').startswith('composed-'):
         package_to_save['id'] = str(uuid.uuid4())

    try:
        # TODO: Implement saving package to data storage (e.g., OpenSearch)
        # saved_package_id = saved_packages_repo.create(package_to_save)
        # For now, just acknowledge receipt and return the generated ID
        logger.info(f"Received package to save for user {current_user['username']}: {package_to_save.get('id','no_id')}")
        # Assuming create method returns the saved package ID or object with ID
        # return jsonify({'message': 'Package saved successfully', 'package_id': saved_package_id}), 201
        # Returning the received data with the (potentially new) ID for now
        return jsonify({'message': 'Package received for saving', 'package': package_to_save}), 201
    except Exception as e:
        logger.error(f"Error saving package for user {current_user['username']}: {e}", exc_info=True)
        return jsonify({'message': 'Error saving package', 'error': str(e)}), 500

@saved_packages_bp.route('/', methods=['GET']) # Corrected route
@cross_origin() # Or handle CORS at app level
@login_required # Use the correct decorator
def get_saved_packages(current_user):
    """Retrieves all saved packages for the authenticated user."""
    user_id = str(current_user['_id'])
    try:
        # TODO: Implement fetching saved packages from data storage by user ID
        # saved_packages = saved_packages_repo.find_by_user(user_id)
        # For now, return mock data or empty list
        logger.info(f"Fetching saved packages for user {current_user['username']}")
        mock_packages = [
            # Example mock saved package (should match TravelPackage schema and include userId)
            # {
            #     "id": "mock-saved-1",
            #     "title": "Mock Saved Trip to Rome",
            #     "description": "A test saved package.",
            #     "destination": "Rome",
            #     "imageUrl": "",
            #     "rating": "5",
            #     "reviewCount": 10,
            #     "accommodationName": "Mock Hotel",
            #     "accommodationType": "Hotel",
            #     "transportType": "",
            #     "durationDays": 3,
            #     "durationNights": 2,
            #     "experiences": ["Mock Experience 1", "Mock Experience 2"],
            #     "price": 500,
            #     "isRecommended": False,
            #     "categories": ["test"],
            #     "userId": user_id
            # }
        ]
        # return jsonify(saved_packages), 200
        return jsonify(mock_packages), 200
    except Exception as e:
        logger.error(f"Error fetching saved packages for user {current_user['username']}: {e}", exc_info=True)
        return jsonify({'message': 'Error fetching saved packages', 'error': str(e)}), 500

@saved_packages_bp.route('/<package_id>', methods=['DELETE']) # Corrected route
@cross_origin() # Or handle CORS at app level
@login_required # Use the correct decorator
def delete_saved_package(current_user, package_id):
    """Deletes a specific saved package for the authenticated user."""
    user_id = str(current_user['_id'])
    try:
        # TODO: Implement deleting saved package from data storage by package ID and user ID
        # Ensure the package belongs to the current user before deleting
        # success = saved_packages_repo.delete(package_id, user_id)

        # Mock deletion logic
        success = True # Assume deletion is successful for now

        if success:
            logger.info(f"Received request to delete package {package_id} for user {current_user['username']}. Mock success.")
            return jsonify({'message': 'Package deleted successfully'}), 200
        else:
            # If package not found or doesn't belong to user
            logger.warning(f"Attempted to delete package {package_id} not found or not belonging to user {user_id}. Mock failure.")
            return jsonify({'message': 'Package not found or not authorized'}), 404
    except Exception as e:
        logger.error(f"Error deleting saved package {package_id} for user {current_user['username']}: {e}", exc_info=True)
        return jsonify({'message': 'Error deleting saved package', 'error': str(e)}), 500
