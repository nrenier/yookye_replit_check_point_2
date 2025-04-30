from flask import Blueprint, request, jsonify
from flask_cors import cross_origin # Assuming CORS is handled at the app level, but good to have
from ..utils.auth import token_required # Assuming you have a token_required decorator
# from ..models.repositories import SavedPackagesRepository # Will need a repository
# from ..config.settings import INDEX_SAVED_PACKAGES # Will need a setting for index name

saved_packages_bp = Blueprint('saved_packages', __name__)

# Initialize repository (will need actual implementation)
# saved_packages_repo = SavedPackagesRepository()

@saved_packages_bp.route('/saved-packages', methods=['POST'])
@cross_origin() # Or handle CORS at app level
@token_required # Protect this endpoint
def save_package(current_user):
    """Saves a user-composed package."""
    data = request.json
    if not data:
        return jsonify({'message': 'Invalid input: missing package data'}), 400

    # Add user ID to the package data
    package_to_save = data
    package_to_save['userId'] = str(current_user['_id'])
    # Generate a unique ID for the saved package if not already present
    # package_to_save['id'] = package_to_save.get('id', str(uuid.uuid4())) # Requires uuid import

    try:
        # TODO: Implement saving package to data storage (e.g., OpenSearch)
        # saved_package_id = saved_packages_repo.create(package_to_save)
        # For now, just acknowledge receipt
        print(f"Received package to save for user {current_user['username']}: {package_to_save}")
        return jsonify({'message': 'Package received for saving', 'package_id': package_to_save.get('id', 'temp_id')}), 201
    except Exception as e:
        print(f"Error saving package: {e}")
        return jsonify({'message': 'Error saving package'}), 500

@saved_packages_bp.route('/saved-packages', methods=['GET'])
@cross_origin() # Or handle CORS at app level
@token_required # Protect this endpoint
def get_saved_packages(current_user):
    """Retrieves all saved packages for the authenticated user."""
    user_id = str(current_user['_id'])
    try:
        # TODO: Implement fetching saved packages from data storage by user ID
        # saved_packages = saved_packages_repo.find_by_user(user_id)
        # For now, return mock data or empty list
        print(f"Fetching saved packages for user {current_user['username']}")
        mock_packages = [
            # Example mock saved package (should match TravelPackage schema)
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
        return jsonify(mock_packages), 200
    except Exception as e:
        print(f"Error fetching saved packages: {e}")
        return jsonify({'message': 'Error fetching saved packages'}), 500

@saved_packages_bp.route('/saved-packages/<package_id>', methods=['DELETE'])
@cross_origin() # Or handle CORS at app level
@token_required # Protect this endpoint
def delete_saved_package(current_user, package_id):
    """Deletes a specific saved package for the authenticated user."""
    user_id = str(current_user['_id'])
    try:
        # TODO: Implement deleting saved package from data storage by package ID and user ID
        # success = saved_packages_repo.delete(package_id, user_id)
        # if success:
        print(f"Received request to delete package {package_id} for user {current_user['username']}")
        return jsonify({'message': 'Package received for deletion'}), 200
        # else:
        #    return jsonify({'message': 'Package not found or not authorized'}), 404
    except Exception as e:
        print(f"Error deleting saved package: {e}")
        return jsonify({'message': 'Error deleting saved package'}), 500
